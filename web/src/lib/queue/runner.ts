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
    const items = await this.db.items.where('status').anyOf('waiting', 'uploading').toArray();
    for (const item of items) {
      const lostFile = item.storage !== 'stored' && !this.files.has(item.mediaId);
      if (lostFile) {
        await this.db.items.update(item.mediaId, { status: 'needsRepick' });
      } else if (item.status === 'uploading') {
        await this.db.items.update(item.mediaId, { status: 'waiting', resumed: true, nextAttemptAt: this.now() });
      }
    }
    this.kick();
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

  /** "Hantar sekarang": items held for wifi go into the queue. */
  async release(eventId: string): Promise<void> {
    await this.db.items
      .where({ eventId, status: 'held' })
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
    await this.db.items.update(match.mediaId, { status: 'waiting', nextAttemptAt: this.now(), resumed: true });
    this.kick();
    return true;
  }

  onSent(listener: (item: QueueItem) => void): () => void {
    this.sentListeners.add(listener);
    return () => this.sentListeners.delete(listener);
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
      .filter((item) => item.nextAttemptAt <= now)
      .toArray();
    due.sort((a, b) => a.priority - b.priority || a.createdAt - b.createdAt);
    const next = due[0];
    if (!next) return false;
    await this.send(next);
    return true;
  }

  private async send(item: QueueItem): Promise<void> {
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
      const uid = await remote.uid();
      if (!item.docCreated) {
        await remote.ensureMediaDoc(item, uid);
        await this.db.items.update(item.mediaId, { docCreated: true });
      }
      if (!item.metaWritten) {
        await remote.writeMeta(item);
        await this.db.items.update(item.mediaId, { metaWritten: true });
      }
      const path = storagePaths.mediaOriginal(item.eventId, uid, item.mediaId);
      // The upload may have finished last time even if its reply was lost.
      if (!(await remote.fileExists(path))) {
        let lastSaved = 0;
        await remote.upload(
          path,
          data,
          item.contentType,
          (bytes) => {
            const t = this.now();
            if (t - lastSaved < 500) return;
            lastSaved = t;
            void this.db.items.update(item.mediaId, { bytesTransferred: bytes });
          },
          new AbortController().signal,
        );
      }
      await this.db.transaction('rw', this.db.items, this.db.blobs, async () => {
        await this.db.items.update(item.mediaId, {
          status: 'sent',
          bytesTransferred: item.sizeBytes,
          lastError: null,
        });
        await this.db.blobs.delete(item.mediaId);
      });
      this.files.delete(item.mediaId);
      const sent = await this.db.items.get(item.mediaId);
      if (sent) this.sentListeners.forEach((listener) => listener(sent));
    } catch (error) {
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

  private async scheduleNextRetry(): Promise<void> {
    // Offline: the browser's "online" event restarts the queue instead.
    if (!this.isOnline()) return;
    const waiting = await this.db.items.where('status').equals('waiting').toArray();
    if (waiting.length === 0) return;
    const soonest = Math.min(...waiting.map((item) => item.nextAttemptAt));
    this.cancelTimer = this.setTimer(() => this.kick(), Math.max(0, soonest - this.now()));
  }
}
