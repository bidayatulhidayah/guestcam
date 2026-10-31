import 'fake-indexeddb/auto';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { QueueDb } from '../src/lib/queue/db';
import { UploadQueue } from '../src/lib/queue/runner';
import type { QueueItem, QueueRemote } from '../src/lib/queue/types';

const UID = 'guest-uid';
let db: QueueDb;
let clock = 1_000_000;
let dbCount = 0;

/** A fake server that records what happened and can be told to fail. */
function fakeRemote() {
  const docs = new Set<string>();
  const files = new Set<string>();
  const calls = { docCreates: 0, metaWrites: 0, uploads: 0 };
  let failUploads = 0;
  let failWith: { code: string } | Error = new Error('network down');
  let loseReply = false;
  const remote: QueueRemote = {
    uid: async () => UID,
    ensureMediaDoc: async (item) => {
      if (docs.has(item.mediaId)) return;
      calls.docCreates++;
      docs.add(item.mediaId);
    },
    writeMeta: async () => {
      calls.metaWrites++;
    },
    fileExists: async (path) => files.has(path),
    upload: async (path, _data, _type, onProgress) => {
      if (failUploads > 0) {
        failUploads--;
        throw failWith;
      }
      calls.uploads++;
      onProgress(4);
      files.add(path);
      if (loseReply) {
        loseReply = false;
        throw new Error('reply lost after the upload finished');
      }
    },
  };
  return {
    remote,
    calls,
    files,
    failNext(count: number, error: { code: string } | Error = new Error('network down')) {
      failUploads = count;
      failWith = error;
    },
    loseNextReply() {
      loseReply = true;
    },
  };
}

function item(overrides: Partial<QueueItem> = {}): QueueItem {
  const mediaId = overrides.mediaId ?? crypto.randomUUID();
  return {
    mediaId,
    eventId: 'event1',
    spaceId: 'space1',
    source: 'snapshot',
    type: 'image',
    contentType: 'image/jpeg',
    sizeBytes: 4,
    fileName: `${mediaId}.jpg`,
    lastModified: 1,
    storage: 'stored',
    status: 'waiting',
    priority: 0,
    createdAt: clock,
    attempts: 0,
    nextAttemptAt: 0,
    lastError: null,
    bytesTransferred: 0,
    resumed: false,
    visibility: 'private',
    showName: false,
    capturedAtMs: null,
    capturedAtSource: 'device',
    width: null,
    height: null,
    meta: { location: null, exif: {}, originalFileName: null },
    docCreated: false,
    metaWritten: false,
    ...overrides,
  };
}

const bytes = () => new Blob([new Uint8Array([1, 2, 3, 4])]);

function newQueue(remote: QueueRemote, extra: Partial<ConstructorParameters<typeof UploadQueue>[0]> = {}) {
  return new UploadQueue({
    db,
    remote,
    now: () => clock,
    random: () => 0,
    setTimer: () => () => undefined,
    ...extra,
  });
}

beforeEach(async () => {
  clock = 1_000_000;
  db = new QueueDb(`queue-test-${dbCount++}`);
  await db.open();
});

afterEach(async () => {
  await db.delete();
});

describe('upload queue', () => {
  it('saves a camera capture to IndexedDB before sending, then removes the bytes once sent', async () => {
    const server = fakeRemote();
    const queue = newQueue(server.remote);
    const first = item();
    // Not started yet: the capture must already be stored.
    await db.items.put(first);
    await db.blobs.put({ mediaId: first.mediaId, blob: bytes() });
    expect(await db.blobs.get(first.mediaId)).toBeDefined();

    await queue.drain();
    expect((await db.items.get(first.mediaId))?.status).toBe('sent');
    expect(await db.blobs.get(first.mediaId)).toBeUndefined();
    expect(server.calls).toEqual({ docCreates: 1, metaWrites: 1, uploads: 1 });
  });

  it('sends one at a time, photos before videos, oldest first', async () => {
    const order: string[] = [];
    const server = fakeRemote();
    const remote: QueueRemote = {
      ...server.remote,
      upload: async (path, data, type, onProgress, signal) => {
        order.push(path.split('/').at(-1) ?? '');
        await server.remote.upload(path, data, type, onProgress, signal);
      },
    };
    const queue = newQueue(remote);
    await queue.add(item({ mediaId: 'video-old', type: 'video', priority: 1, createdAt: 1 }), bytes());
    await queue.add(item({ mediaId: 'photo-new', createdAt: 3 }), bytes());
    await queue.add(item({ mediaId: 'photo-old', createdAt: 2 }), bytes());
    await queue.drain();
    // The first add starts sending at once; the rest follow photos-first.
    expect(order.slice(1)).toEqual(['photo-old', 'photo-new']);
    expect(order).toHaveLength(3);
  });

  it('retries after a network error, waiting longer each time', async () => {
    const server = fakeRemote();
    const queue = newQueue(server.remote);
    server.failNext(2);
    const one = item();
    await queue.add(one, bytes());
    await queue.drain();

    let saved = await db.items.get(one.mediaId);
    expect(saved).toMatchObject({ status: 'waiting', attempts: 1 });
    const firstWait = (saved?.nextAttemptAt ?? 0) - clock;

    clock += firstWait;
    await queue.drain();
    saved = await db.items.get(one.mediaId);
    expect(saved).toMatchObject({ status: 'waiting', attempts: 2 });
    expect((saved?.nextAttemptAt ?? 0) - clock).toBeGreaterThan(firstWait);

    clock = saved?.nextAttemptAt ?? clock;
    await queue.drain();
    expect((await db.items.get(one.mediaId))?.status).toBe('sent');
  });

  it('does not retry before the wait is over', async () => {
    const server = fakeRemote();
    const queue = newQueue(server.remote);
    server.failNext(1);
    const one = item();
    await queue.add(one, bytes());
    await queue.drain();
    await queue.drain();
    expect((await db.items.get(one.mediaId))?.attempts).toBe(1);
    expect(server.calls.uploads).toBe(0);
  });

  it('never duplicates: a lost reply after a finished upload sends nothing twice (pitfall U1)', async () => {
    const server = fakeRemote();
    const queue = newQueue(server.remote);
    server.loseNextReply();
    const one = item();
    await queue.add(one, bytes());
    await queue.drain();
    expect((await db.items.get(one.mediaId))?.status).toBe('waiting');

    clock += 10 * 60_000;
    await queue.drain();
    expect((await db.items.get(one.mediaId))?.status).toBe('sent');
    expect(server.calls.uploads).toBe(1);
    expect(server.calls.docCreates).toBe(1);
    expect(server.calls.metaWrites).toBe(1);
  });

  it('restarts after a reload: an interrupted upload resumes, a lost gallery pick asks to be picked again', async () => {
    const server = fakeRemote();
    const camera = item({ status: 'uploading', docCreated: true });
    const picked = item({ storage: 'picked', source: 'galleryUpload', fileName: 'IMG_1.MOV', sizeBytes: 4, lastModified: 42 });
    await db.items.bulkPut([camera, picked]);
    await db.blobs.put({ mediaId: camera.mediaId, blob: bytes() });

    // A new page: a fresh queue with no files in memory.
    const queue = newQueue(server.remote);
    await queue.start();
    await queue.drain();
    expect(await db.items.get(camera.mediaId)).toMatchObject({ status: 'sent', resumed: true });
    expect((await db.items.get(picked.mediaId))?.status).toBe('needsRepick');
    expect(server.calls.docCreates).toBe(0);

    // Picking the same file again continues the same item (same mediaId).
    const file = new File([new Uint8Array([1, 2, 3, 4])], 'IMG_1.MOV', { lastModified: 42 });
    expect(await queue.reattach('event1', file)).toBe(true);
    await queue.drain();
    expect((await db.items.get(picked.mediaId))?.status).toBe('sent');
    expect(await db.items.count()).toBe(2);
    // A different file does not match.
    expect(await queue.reattach('event1', new File([new Uint8Array([9])], 'other.jpg'))).toBe(false);
  });

  it('when IndexedDB is full, keeps the capture in memory and still sends it (pitfall U4)', async () => {
    const server = fakeRemote();
    const queue = newQueue(server.remote);
    const full = Object.assign(new Error('full'), { name: 'QuotaExceededError' });
    db.blobs.put = (() => Promise.reject(full)) as unknown as typeof db.blobs.put;
    const one = item();
    const result = await queue.add(one, bytes());
    expect(result.quotaFallback).toBe(true);
    expect(result.item.storage).toBe('memory');
    await queue.drain();
    expect((await db.items.get(one.mediaId))?.status).toBe('sent');
  });

  it('stops at failed for errors the guest must act on, and "Cuba lagi" re-queues', async () => {
    const server = fakeRemote();
    const queue = newQueue(server.remote);
    server.failNext(1, { code: 'storage/unauthorized' });
    const one = item();
    await queue.add(one, bytes());
    await queue.drain();
    expect((await db.items.get(one.mediaId))?.status).toBe('failed');

    await queue.retryFailed('event1');
    await queue.drain();
    expect((await db.items.get(one.mediaId))?.status).toBe('sent');
  });

  it('holds items for wifi until the guest sends them', async () => {
    const server = fakeRemote();
    const queue = newQueue(server.remote);
    const big = item({ status: 'held', type: 'video', priority: 1 });
    await queue.add(big, bytes());
    await queue.drain();
    expect((await db.items.get(big.mediaId))?.status).toBe('held');
    await queue.release('event1');
    await queue.drain();
    expect((await db.items.get(big.mediaId))?.status).toBe('sent');
  });

  it('subscribing the same callback twice and dropping one keeps the other (menu re-subscribes)', async () => {
    const server = fakeRemote();
    const queue = newQueue(server.remote);
    let calls = 0;
    const onSent = () => calls++;
    const first = queue.onSent(onSent);
    queue.onSent(onSent);
    first();
    await queue.add(item(), bytes());
    await queue.drain();
    expect(calls).toBe(1);
  });

  it('knows whether anything added on this page is still unsent (memory-only storage guard)', async () => {
    const server = fakeRemote();
    const queue = newQueue(server.remote);
    expect(queue.hasUnsent()).toBe(false);
    await queue.add(item(), bytes());
    expect(queue.hasUnsent()).toBe(true);
    await queue.drain();
    expect(queue.hasUnsent()).toBe(false);
  });

  it('an app update may reload only when nothing lives just in memory (gallery picks, storage-full captures)', async () => {
    const server = fakeRemote();
    const queue = newQueue(server.remote);
    const camera = item();
    await queue.add(camera, bytes());
    expect(queue.canReloadSafely()).toBe(true);

    const picked = item({ storage: 'picked', source: 'galleryUpload', status: 'held', type: 'video', priority: 1 });
    await queue.add(picked, bytes());
    expect(queue.canReloadSafely()).toBe(false);

    await queue.release('event1');
    await queue.drain();
    expect((await db.items.get(picked.mediaId))?.status).toBe('sent');
    expect(queue.canReloadSafely()).toBe(true);
  });

  it('a camera photo is saved while EXIF is read, then sent; a reload mid-way still sends it (rule 4)', async () => {
    const server = fakeRemote();
    const queue = newQueue(server.remote);
    const photo = item({ status: 'preparing' });
    await queue.add(photo, bytes());
    await queue.drain();
    // Saved, but not sent before its details are in.
    expect(await db.blobs.get(photo.mediaId)).toBeDefined();
    expect((await db.items.get(photo.mediaId))?.status).toBe('preparing');
    await queue.finishPreparing(photo.mediaId, { capturedAtSource: 'exif', capturedAtMs: 123 });
    await queue.drain();
    expect(await db.items.get(photo.mediaId)).toMatchObject({ status: 'sent', capturedAtSource: 'exif' });

    // Page closed while EXIF was being read: the next page sends it anyway.
    const interrupted = item({ status: 'preparing' });
    await db.items.put(interrupted);
    await db.blobs.put({ mediaId: interrupted.mediaId, blob: bytes() });
    const reloaded = newQueue(server.remote);
    await reloaded.start();
    await reloaded.drain();
    expect((await db.items.get(interrupted.mediaId))?.status).toBe('sent');
  });

  it('waits while offline', async () => {
    const server = fakeRemote();
    let online = false;
    const queue = newQueue(server.remote, { isOnline: () => online });
    const one = item();
    await queue.add(one, bytes());
    await queue.drain();
    expect((await db.items.get(one.mediaId))?.status).toBe('waiting');
    online = true;
    await queue.drain();
    expect((await db.items.get(one.mediaId))?.status).toBe('sent');
  });
});
