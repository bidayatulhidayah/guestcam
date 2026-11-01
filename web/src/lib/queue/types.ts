import type { CapturedAtSource, GeoLocation, Visibility } from '@guestcam/shared';

/**
 * Where an item's bytes live until they are sent:
 * - `stored`: camera captures, saved in IndexedDB first (rule 4).
 * - `picked`: gallery picks, streamed from the original File in memory
 *   (pitfall U5); after a reload the guest is asked to pick them again.
 * - `memory`: IndexedDB was full (pitfall U4); kept in memory with a warning.
 */
export type ItemStorage = 'stored' | 'picked' | 'memory';

export type ItemStatus =
  /** Camera photo already saved; EXIF still being read. Not sent yet. */
  | 'preparing'
  /** Waiting for its turn (or for the next retry). */
  | 'waiting'
  /** "Nanti guna wifi": held until the guest taps send. */
  | 'held'
  | 'uploading'
  | 'sent'
  /** Needs the guest: refused by the server; "Cuba lagi" re-queues it. */
  | 'failed'
  /** A gallery pick whose File was lost on reload; pick it again. */
  | 'needsRepick';

export interface ItemMeta {
  location: GeoLocation | null;
  exif: Record<string, string | number | boolean | null>;
  originalFileName: string | null;
}

export interface QueueItem {
  /** UUID made at capture: doc id and storage file name (rule 11). */
  mediaId: string;
  eventId: string;
  spaceId: string;
  source: 'snapshot' | 'galleryUpload';
  type: 'image' | 'video';
  contentType: string;
  sizeBytes: number;
  /** Fingerprint for re-picking: name + size + lastModified. */
  fileName: string;
  lastModified: number;
  storage: ItemStorage;
  status: ItemStatus;
  /** Photos before videos (0 before 1), then oldest first. */
  priority: number;
  createdAt: number;
  attempts: number;
  nextAttemptAt: number;
  lastError: string | null;
  bytesTransferred: number;
  /** True once the queue restarted this item after a reload ("Menyambung semula"). */
  resumed: boolean;
  visibility: Visibility;
  showName: boolean;
  capturedAtMs: number | null;
  capturedAtSource: CapturedAtSource;
  width: number | null;
  height: number | null;
  meta: ItemMeta;
  docCreated: boolean;
  metaWritten: boolean;
  /**
   * Captured before the guest answered the first privacy question: not sent
   * until they answer. After a reload it is sent as Peribadi (the safe default).
   */
  awaitingChoice?: boolean;
  /**
   * My Uploads preview: `ready` once saved in `thumbs`, `none` when this
   * phone could not make one (neutral placeholder). Missing = not made yet.
   * Set on the item so the list updates the moment the preview exists.
   */
  preview?: 'ready' | 'none';
}

/** The server side of an upload, so the runner can be tested without Firebase. */
export interface QueueRemote {
  /** Anonymous uid of this phone. */
  uid(): Promise<string>;
  /** Creates the queued media doc unless it already exists (pitfall U1/U2). */
  ensureMediaDoc(item: QueueItem, uid: string): Promise<void>;
  /** Writes private/meta once. */
  writeMeta(item: QueueItem): Promise<void>;
  /** The guest switched privacy while the doc was being created: bring the doc in line. */
  updateVisibility(item: QueueItem): Promise<void>;
  fileExists(path: string): Promise<boolean>;
  upload(
    path: string,
    data: Blob,
    contentType: string,
    onProgress: (bytes: number) => void,
    signal: AbortSignal,
  ): Promise<void>;
}

/** Errors the guest must act on (e.g. upload window closed); not retried automatically. */
export function isPermanentError(error: unknown): boolean {
  const code = (error as { code?: string } | null)?.code ?? '';
  return /permission-denied|unauthorized|invalid-argument|unauthenticated/.test(code);
}
