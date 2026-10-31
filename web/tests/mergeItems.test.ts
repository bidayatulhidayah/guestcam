import { describe, expect, it } from 'vitest';
import type { QueueItem } from '../src/lib/queue/types';
import { mergeItems, type ServerItem } from '../src/features/uploads/mergeItems';

function local(mediaId: string, overrides: Partial<QueueItem> = {}): QueueItem {
  return {
    mediaId,
    eventId: 'event1',
    spaceId: 'space1',
    source: 'snapshot',
    type: 'image',
    contentType: 'image/jpeg',
    sizeBytes: 100,
    fileName: `${mediaId}.jpg`,
    lastModified: 0,
    storage: 'stored',
    status: 'waiting',
    priority: 0,
    createdAt: 1000,
    attempts: 0,
    nextAttemptAt: 0,
    lastError: null,
    bytesTransferred: 0,
    resumed: false,
    visibility: 'private',
    showName: false,
    capturedAtMs: null,
    capturedAtSource: 'upload',
    width: null,
    height: null,
    meta: { location: null, exif: {}, originalFileName: null },
    docCreated: false,
    metaWritten: false,
    ...overrides,
  };
}

function server(mediaId: string, overrides: Partial<ServerItem> = {}): ServerItem {
  return { mediaId, type: 'image', status: 'uploaded', visibility: 'private', showName: false, createdAtMs: 1000, ...overrides };
}

describe('My Uploads: phone and server merged by mediaId', () => {
  it('shows an item on both sides once', () => {
    const rows = mergeItems([local('a', { status: 'sent', docCreated: true })], [server('a')]);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ mediaId: 'a', status: 'sent', local: true, hasDoc: true });
  });

  it('the phone tells how an upload is going; the server tells what happened after', () => {
    const rows = mergeItems(
      [
        local('sending', { status: 'uploading', bytesTransferred: 40, docCreated: true, createdAt: 3 }),
        local('refused', { status: 'sent', docCreated: true, createdAt: 2 }),
      ],
      [server('sending', { status: 'queued' }), server('refused', { status: 'failed' })],
    );
    expect(rows.find((r) => r.mediaId === 'sending')).toMatchObject({ status: 'uploading', percent: 40 });
    expect(rows.find((r) => r.mediaId === 'refused')).toMatchObject({ status: 'rejected' });
  });

  it('sent on the phone but not yet processed on the server: still "sent", not "not arrived"', () => {
    const rows = mergeItems([local('a', { status: 'sent', docCreated: true })], [server('a', { status: 'queued' })]);
    expect(rows[0]?.status).toBe('sent');
  });

  it('privacy comes from the server once the doc exists, from the phone before', () => {
    const rows = mergeItems(
      [local('onServer', { visibility: 'private', docCreated: true }), local('phoneOnly', { visibility: 'public', showName: true })],
      [server('onServer', { visibility: 'public', showName: true })],
    );
    expect(rows.find((r) => r.mediaId === 'onServer')).toMatchObject({ visibility: 'public', showName: true, hasDoc: true });
    expect(rows.find((r) => r.mediaId === 'phoneOnly')).toMatchObject({ visibility: 'public', hasDoc: false });
  });

  it('server-only items: queued means not arrived, failed means refused', () => {
    const rows = mergeItems([], [server('q', { status: 'queued' }), server('f', { status: 'failed' }), server('r', { status: 'ready' })]);
    expect(Object.fromEntries(rows.map((r) => [r.mediaId, r.status]))).toEqual({ q: 'notArrived', f: 'rejected', r: 'sent' });
    expect(rows.every((r) => !r.local && r.hasDoc)).toBe(true);
  });

  it('newest first', () => {
    const rows = mergeItems([local('old', { createdAt: 1 }), local('new', { createdAt: 3 })], [server('mid', { createdAtMs: 2 })]);
    expect(rows.map((r) => r.mediaId)).toEqual(['new', 'mid', 'old']);
  });
});
