import { storagePaths } from '@guestcam/shared';
import { retryDelayMs } from './backoff';
import { isQuotaError, type QueueDb } from './db';
import { isPermanentError, type QueueItem, type QueueRemote } from './types';

export interface QueueOptions {
  db: QueueDb;
  remote: QueueRemote;
  now?: () => number;
  random?: () => number;
  isOnline?: () => boolean;
  /** Schedules a wake-up; returns a cancel function. */
  setTimer?: (callback: () => void, ms: number) => () => void;
}

/** A network step (sign-in, media doc, file check) that takes longer is given up and retried. */
export const STEP_TIMEOUT_MS = 45_000;
/** An upload with no bytes moving for this long is given up and retried (Firebase alone retries for 10 minutes). */
export const STALL_MS = 60_000;

/** A step that hung: retried like a network error, never blocking the queue. */
class StalledError extends Error {
  readonly code = 'stalled';
}

export interface AddResult {
  item: QueueItem;
  /** IndexedDB was full: the capture is only in memory, so the page must stay open (pitfall U4). */
  quotaFallback: boolean;
}

/**
 * The upload queue (AGENTS.md rule 4). Every capture is recorded in IndexedDB
 * before anything is sent; items go up one at a time, photos before videos,
 * oldest first. A failed attempt waits longer each time (up to 5 minutes);
 * errors the guest must fix (e.g. upload window closed) stop at `failed`.
 * The same `mediaId` is used on every attempt, and finished steps are
 * skipped, so a retry never creates a duplicate (pitfall U1).
 */
export class UploadQueue {
  /** Bytes of `picked` and `memory` items. Lost on reload by nature. */
  readonly files = new Map<string, Blob>();
  /** Items added on this page and not sent yet. */
  private readonly unsent = new Set<string>();
  /** Items the guest deleted in My Uploads: never sent again on this page. */
  private readonly removed = new Set<string>();
  /** The item being sent now, so a delete can stop it. */
  private sending: { mediaId: string; controller: AbortController; done: Promise<void> } | undefined;
  private readonly now: () => number;
  private readonly random: () => number;
  private readonly isOnline: () => boolean;
  private readonly setTimer: (callback: () => void, ms: number) => () => void;
  private current: Promise<void> | undefined;
  private runAgain = false;
  private cancelTimer: (() => void) | undefined;
  private readonly sentListeners = new Set<(item: QueueItem) => void>();

  constructor(private readonly options: QueueOptions) {
    this.now = options.now ?? Date.now;
    this.random = options.random ?? Math.random;
    this.isOnline = options.isOnline ?? (() => true);
    this.setTimer =
      options.setTimer ??
      ((callback, ms) => {
        const id = setTimeout(callback, ms);
        return () => clearTimeout(id);
      });
  }

  private get db() {
    return this.options.db;
  }

  /**
   * After a page load: an item interrupted mid-upload is queued again and
   * marked "Menyambung semula" (pitfall U3). Gallery picks whose File was lost
   * wait for the guest to pick them again (pitfall U5).
   */
  async start(): Promise<void> {
    // A photo whose EXIF was still being read when the page closed: send it without.
    await this.db.items.where('status').equals('preparing').modify({ status: 'waiting', nextAttemptAt: this.now() });
    // The page closed at the privacy question: send as Peribadi; the question is asked again next time.
    await this.db.items
      .filter((item) => item.awaitingChoice === true)
      .modify({ awaitingChoice: false, visibility: 'private', showName: false });
    const items = await this.db.items.where('status').anyOf('waiting', 'uploading').toArray();
    for (const item of items) {
      const lostFile = item.storage !== 'stored' && !this.files.has(item.mediaId);
      if (lostFile) {
        await this.db.items.update(item.mediaId, { status: 'needsRepick' });
      } else if (item.status === 'uploading') {
        await this.db.items.update(item.mediaId, { status: 'waiting', resumed: true, nextAttemptAt: this.now() });
      }
    }
    // A reload is the guest asking to try now: no item keeps waiting out an earlier retry delay.
    await this.retryNow();
  }

  /**
   * Waiting items are due at once (the page was reloaded, the phone is back
   * online, or the guest came back to the app), then the queue starts.
   */
  async retryNow(): Promise<void> {
    await this.db.items.where('status').equals('waiting').modify({ nextAttemptAt: this.now() });
    this.kick();
  }

  /** Rejects with `StalledError` if `work` takes longer than `ms`. */
  private within<T>(work: Promise<T>, ms = STEP_TIMEOUT_MS): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const cancel = this.setTimer(() => reject(new StalledError('step timed out')), ms);
      work.then(
        (value) => {
          cancel();
          resolve(value);
        },
        (error: unknown) => {
          cancel();
          reject(error instanceof Error ? error : new Error(String(error)));
        },
      );
    });
  }

  /** Records a new capture, then starts sending. */
  async add(item: QueueItem, data: Blob): Promise<AddResult> {
    let storage = item.storage;
    if (storage === 'stored') {
      try {
        await this.db.blobs.put({ mediaId: item.mediaId, blob: data });
      } catch (error) {
        if (!isQuotaError(error)) throw error;
        storage = 'memory';
      }
    }
    if (storage !== 'stored') this.files.set(item.mediaId, data);
    this.unsent.add(item.mediaId);
    const saved = { ...item, storage };
    await this.db.items.put(saved);
    this.kick();
    return { item: saved, quotaFallback: storage === 'memory' && item.storage === 'stored' };
  }

  /** Adds the details read after saving (EXIF) and lets a `preparing` item be sent. */
  async finishPreparing(mediaId: string, details: Partial<QueueItem>): Promise<void> {
    await this.db.items.update(mediaId, { ...details, status: 'waiting', nextAttemptAt: this.now() });
    this.kick();
  }

  /** The guest answered the privacy question: these items may go, with their choice. */
  async choose(mediaIds: string[], visibility: QueueItem['visibility'], showName: boolean): Promise<void> {
    await this.db.items.where('mediaId').anyOf(mediaIds).modify({ awaitingChoice: false, visibility, showName });
    this.kick();
  }

  /**
   * My Uploads: switch an item that has not reached the server yet. If its doc
   * is being created at this moment, `send` notices the change and updates it.
   */
  async setVisibility(mediaId: string, visibility: QueueItem['visibility'], showName: boolean): Promise<void> {
    await this.db.items.update(mediaId, { visibility, showName, awaitingChoice: false });
    this.kick();
  }

  /**
   * My Uploads "Padam": stops the item's upload if it is running and forgets
   * it on this phone. Returns whether its media doc may exist on the server
   * (the caller deletes it; the server then removes any file, rule 11).
   */
  async remove(mediaId: string): Promise<{ docCreated: boolean }> {
    this.removed.add(mediaId);
    if (this.sending?.mediaId === mediaId) {
      this.sending.controller.abort();
      await this.sending.done.catch(() => undefined);
    }
    let docCreated = false;
    await this.db.transaction('rw', this.db.items, this.db.blobs, this.db.thumbs, async () => {
      docCreated = (await this.db.items.get(mediaId))?.docCreated === true;
      await this.db.items.delete(mediaId);
      await this.db.blobs.delete(mediaId);
      await this.db.thumbs.delete(mediaId);
    });
    this.files.delete(mediaId);
    this.unsent.delete(mediaId);
    return { docCreated };
  }

  /**
   * Keeps a small preview for My Uploads (or notes that none could be made),
   * unless the item was deleted meanwhile. It stays after the item is sent;
   * only `remove` deletes it.
   */
  async savePreview(mediaId: string, blob: Blob | null): Promise<void> {
    await this.db.transaction('rw', this.db.items, this.db.thumbs, async () => {
      if (!(await this.db.items.get(mediaId))) return;
      if (blob) await this.db.thumbs.put({ mediaId, blob });
      await this.db.items.update(mediaId, { preview: blob ? 'ready' : 'none' });
    });
  }

  /** "Hantar sekarang": items held for wifi go into the queue (all of the event's, or only these). */
  async release(eventId: string, mediaIds?: string[]): Promise<void> {
    await this.db.items
      .where({ eventId, status: 'held' })
      .filter((item) => mediaIds === undefined || mediaIds.includes(item.mediaId))
      .modify({ status: 'waiting', nextAttemptAt: this.now() });
    this.kick();
  }

  /** "Cuba lagi" for items that stopped at `failed`. */
  async retryFailed(eventId: string): Promise<void> {
    await this.db.items
      .where({ eventId, status: 'failed' })
      .modify({ status: 'waiting', attempts: 0, nextAttemptAt: this.now(), lastError: null });
    this.kick();
  }

  /**
   * A re-picked file that matches an item waiting for it (same name, size and
   * date) continues that item instead of creating a duplicate. Returns true if matched.
   */
  async reattach(eventId: string, file: File): Promise<boolean> {
    const match = await this.db.items
      .where({ eventId, status: 'needsRepick' })
      .filter((i) => i.fileName === file.name && i.sizeBytes === file.size && i.lastModified === file.lastModified)
      .first();
    if (!match) return false;
    this.files.set(match.mediaId, file);
    this.unsent.add(match.mediaId);
    await this.db.items.update(match.mediaId, { status: 'waiting', nextAttemptAt: this.now(), resumed: true });
    this.kick();
    return true;
  }

  /** True while any item is not sent yet (synchronous: tracked as items are added and sent). */
  hasUnsent(): boolean {
    return this.unsent.size > 0;
  }

  /** False while a file lives only in this page's memory (gallery pick or storage-full capture) and is not sent yet. */
  canReloadSafely(): boolean {
    return this.files.size === 0;
  }

  /**
   * Each call is its own subscription, even with the same function: a screen
   * that subscribes twice (React re-running an effect) and then drops the old
   * subscription must keep the new one.
   */
  onSent(listener: (item: QueueItem) => void): () => void {
    const subscription = (item: QueueItem) => listener(item);
    this.sentListeners.add(subscription);
    return () => this.sentListeners.delete(subscription);
  }

  /** Starts working through the queue (or asks the running pass to look again). */
  kick(): void {
    void this.drain();
  }

  /**
   * Sends every item that is due, one at a time. If a pass is already running,
   * it is asked to look again and the same pass is returned, so awaiting this
   * always waits until nothing is due.
   */
  drain(): Promise<void> {
    if (this.current) {
      this.runAgain = true;
      return this.current;
    }
    this.cancelTimer?.();
    this.current = (async () => {
      try {
        do {
          this.runAgain = false;
          while (await this.runOnce()) {
            // one item at a time
          }
        } while (this.runAgain);
      } finally {
        this.current = undefined;
      }
      await this.scheduleNextRetry();
    })();
    return this.current;
  }

  /** Sends the next due item; false if none is due (or the phone is offline). */
  async runOnce(): Promise<boolean> {
    if (!this.isOnline()) return false;
    const now = this.now();
    const due = await this.db.items
      .where('status')
      .equals('waiting')
      .filter((item) => item.nextAttemptAt <= now && item.awaitingChoice !== true)
      .toArray();
    due.sort((a, b) => a.priority - b.priority || a.createdAt - b.createdAt);
    const next = due[0];
    if (!next) return false;
    const controller = new AbortController();
    const done = this.send(next, controller.signal);
    this.sending = { mediaId: next.mediaId, controller, done };
    try {
      await done;
    } finally {
      this.sending = undefined;
    }
    return true;
  }

  private async send(item: QueueItem, signal: AbortSignal): Promise<void> {
    // Deleted in My Uploads while this step was running: stop, change nothing.
    const stopped = () => signal.aborted || this.removed.has(item.mediaId);
    if (stopped()) return;
    const data =
      item.storage === 'stored' ? (await this.db.blobs.get(item.mediaId))?.blob : this.files.get(item.mediaId);
    if (!data) {
      await this.db.items.update(item.mediaId, {
        status: item.storage === 'stored' ? 'failed' : 'needsRepick',
        lastError: item.storage === 'stored' ? 'missing-bytes' : null,
      });
      return;
    }

    await this.db.items.update(item.mediaId, { status: 'uploading' });
    const { remote } = this.options;
    try {
      // Every network step has a time limit: one hung step must never block the queue.
      const uid = await this.within(remote.uid());
      if (stopped()) return;
      if (!item.docCreated) {
        await this.within(remote.ensureMediaDoc(item, uid));
        await this.db.items.update(item.mediaId, { docCreated: true });
        const now = await this.db.items.get(item.mediaId);
        if (now && (now.visibility !== item.visibility || now.showName !== item.showName)) {
          await this.within(remote.updateVisibility(now));
        }
      }
      if (stopped()) return;
      if (!item.metaWritten) {
        await this.within(remote.writeMeta(item));
        await this.db.items.update(item.mediaId, { metaWritten: true });
      }
      const path = storagePaths.mediaOriginal(item.eventId, uid, item.mediaId);
      // The upload may have finished last time even if its reply was lost.
      if (!(await this.within(remote.fileExists(path)))) await this.upload(item, data, path, signal);
      if (stopped()) return;
      await this.db.transaction('rw', this.db.items, this.db.blobs, async () => {
        await this.db.items.update(item.mediaId, {
          status: 'sent',
          bytesTransferred: item.sizeBytes,
          lastError: null,
        });
        await this.db.blobs.delete(item.mediaId);
      });
      this.files.delete(item.mediaId);
      this.unsent.delete(item.mediaId);
      const sent = await this.db.items.get(item.mediaId);
      if (sent) this.sentListeners.forEach((listener) => listener(sent));
    } catch (error) {
      if (stopped()) return;
      const attempts = item.attempts + 1;
      const lastError = (error as { code?: string; message?: string } | null)?.code ?? String(error);
      await this.db.items.update(
        item.mediaId,
        isPermanentError(error)
          ? { status: 'failed', attempts, lastError }
          : { status: 'waiting', attempts, lastError, nextAttemptAt: this.now() + retryDelayMs(attempts, this.random) },
      );
    }
  }

  /**
   * Sends the file. If no bytes move for `STALL_MS` (a dead connection the
   * SDK would keep retrying), it is cancelled and retried from the queue.
   */
  private async upload(item: QueueItem, data: Blob, path: string, signal: AbortSignal): Promise<void> {
    const controller = new AbortController();
    const stop = () => controller.abort();
    signal.addEventListener('abort', stop, { once: true });
    let stalled = false;
    let cancelWatch = () => {};
    const watch = () => {
      cancelWatch();
      cancelWatch = this.setTimer(() => {
        stalled = true;
        controller.abort();
      }, STALL_MS);
    };
    let lastSaved = 0;
    watch();
    try {
      await this.options.remote.upload(
        path,
        data,
        item.contentType,
        (bytes) => {
          watch();
          const t = this.now();
          if (t - lastSaved < 500) return;
          lastSaved = t;
          void this.db.items.update(item.mediaId, { bytesTransferred: bytes });
        },
        controller.signal,
      );
    } catch (error) {
      throw stalled ? new StalledError('upload stalled') : error;
    } finally {
      cancelWatch();
      signal.removeEventListener('abort', stop);
    }
  }

  private async scheduleNextRetry(): Promise<void> {
    // Offline: the browser's "online" event restarts the queue instead.
    if (!this.isOnline()) return;
    const waiting = await this.db.items.where('status').equals('waiting').toArray();
    if (waiting.length === 0) return;
    const soonest = Math.min(...waiting.map((item) => item.nextAttemptAt));
    this.cancelTimer = this.setTimer(() => this.kick(), Math.max(0, soonest - this.now()));
  }
}
