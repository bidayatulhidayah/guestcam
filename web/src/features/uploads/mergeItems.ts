import type { MediaStatus, MediaType, Visibility } from '@guestcam/shared';
import type { QueueItem } from '../../lib/queue/types';

/** The guest's own media doc, as My Uploads needs it. */
export interface ServerItem {
  mediaId: string;
  type: MediaType;
  status: MediaStatus;
  visibility: Visibility;
  showName: boolean;
  createdAtMs: number | null;
}

export type RowStatus =
  | 'waiting'
  | 'uploading'
  | 'held'
  | 'needsRepick'
  | 'failed'
  | 'sent'
  /** On the server as `queued`, but this phone has no upload for it (e.g. browser data cleared). */
  | 'notArrived'
  /** The server refused the file (plan limits, wrong type). */
  | 'rejected';

export interface UploadRow {
  mediaId: string;
  type: MediaType;
  status: RowStatus;
  /** Upload progress while sending. */
  percent: number | null;
  visibility: Visibility;
  showName: boolean;
  createdAtMs: number;
  /** In the queue on this phone. */
  local: boolean;
  /** A media doc exists (or may exist) on the server. */
  hasDoc: boolean;
  /** This phone's preview (local items only): `ready`, `none`, or not made yet. */
  preview?: QueueItem['preview'];
}

function localStatus(item: QueueItem): RowStatus {
  switch (item.status) {
    case 'preparing':
    case 'waiting':
      return 'waiting';
    case 'uploading':
      return 'uploading';
    case 'held':
      return 'held';
    case 'needsRepick':
      return 'needsRepick';
    case 'failed':
      return 'failed';
    case 'sent':
      return 'sent';
  }
}

function serverStatus(status: MediaStatus): RowStatus {
  if (status === 'queued') return 'notArrived';
  if (status === 'failed') return 'rejected';
  return 'sent';
}

/**
 * My Uploads: the queue on this phone and the guest's media docs, merged by
 * `mediaId` so nothing shows twice. The phone knows best how an upload is
 * going and that its file arrived (the server may not have processed it
 * yet); the server adds only a refusal, and the privacy once its doc exists.
 * Newest first.
 */
export function mergeItems(local: QueueItem[], server: ServerItem[]): UploadRow[] {
  const rows = new Map<string, UploadRow>();
  for (const doc of server) {
    rows.set(doc.mediaId, {
      mediaId: doc.mediaId,
      type: doc.type,
      status: serverStatus(doc.status),
      percent: null,
      visibility: doc.visibility,
      showName: doc.showName,
      createdAtMs: doc.createdAtMs ?? 0,
      local: false,
      hasDoc: true,
    });
  }
  for (const item of local) {
    const doc = rows.get(item.mediaId);
    const status = localStatus(item);
    rows.set(item.mediaId, {
      mediaId: item.mediaId,
      type: item.type,
      status: status === 'sent' && doc?.status === 'rejected' ? 'rejected' : status,
      percent:
        status === 'uploading' && item.sizeBytes > 0
          ? Math.min(100, Math.round((item.bytesTransferred / item.sizeBytes) * 100))
          : null,
      visibility: doc ? doc.visibility : item.visibility,
      showName: doc ? doc.showName : item.showName,
      createdAtMs: item.createdAt,
      local: true,
      hasDoc: doc !== undefined || item.docCreated,
      preview: item.preview,
    });
  }
  return [...rows.values()].sort((a, b) => b.createdAtMs - a.createdAtMs);
}
