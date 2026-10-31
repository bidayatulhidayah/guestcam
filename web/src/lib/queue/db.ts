import Dexie, { type DexieOptions, type EntityTable } from 'dexie';
import type { QueueItem } from './types';

interface StoredBlob {
  mediaId: string;
  blob: Blob;
}

/**
 * IndexedDB for the upload queue: item records, the camera captures' bytes
 * (until sent) and small previews for My Uploads (kept after sending, until
 * server thumbnails arrive in Phase 3).
 */
export class QueueDb extends Dexie {
  items!: EntityTable<QueueItem, 'mediaId'>;
  blobs!: EntityTable<StoredBlob, 'mediaId'>;
  thumbs!: EntityTable<StoredBlob, 'mediaId'>;

  /** `options` can supply another IndexedDB implementation (the in-memory fallback). */
  constructor(name = 'guestcam-queue', options?: DexieOptions) {
    super(name, options);
    this.version(1).stores({
      items: 'mediaId, eventId, status, [eventId+status]',
      blobs: 'mediaId',
    });
    this.version(2).stores({ thumbs: 'mediaId' });
  }
}

/** True for the browser's "storage full" errors (pitfall U4). */
export function isQuotaError(error: unknown): boolean {
  const name = (error as { name?: string; inner?: { name?: string } } | null)?.name ?? '';
  const inner = (error as { inner?: { name?: string } } | null)?.inner?.name ?? '';
  return name === 'QuotaExceededError' || inner === 'QuotaExceededError';
}
