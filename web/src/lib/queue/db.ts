import Dexie, { type EntityTable } from 'dexie';
import type { QueueItem } from './types';

interface StoredBlob {
  mediaId: string;
  blob: Blob;
}

/** IndexedDB for the upload queue: item records and the camera captures' bytes. */
export class QueueDb extends Dexie {
  items!: EntityTable<QueueItem, 'mediaId'>;
  blobs!: EntityTable<StoredBlob, 'mediaId'>;

  constructor(name = 'guestcam-queue') {
    super(name);
    this.version(1).stores({
      items: 'mediaId, eventId, status, [eventId+status]',
      blobs: 'mediaId',
    });
  }
}

/** True for the browser's "storage full" errors (pitfall U4). */
export function isQuotaError(error: unknown): boolean {
  const name = (error as { name?: string; inner?: { name?: string } } | null)?.name ?? '';
  const inner = (error as { inner?: { name?: string } } | null)?.inner?.name ?? '';
  return name === 'QuotaExceededError' || inner === 'QuotaExceededError';
}
