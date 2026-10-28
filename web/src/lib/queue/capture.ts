import { MAX_FILE_BYTES, mediaTypeFor, type Visibility } from '@guestcam/shared';
import { exifDateToMs } from '../media/exifDate';
import type { QueueItem } from './types';

/** Some phones give gallery files no MIME type; fall back to the extension. */
const EXTENSION_TYPES: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  heic: 'image/heic',
  heif: 'image/heif',
  webp: 'image/webp',
  gif: 'image/gif',
  mp4: 'video/mp4',
  mov: 'video/quicktime',
  m4v: 'video/x-m4v',
  '3gp': 'video/3gpp',
  webm: 'video/webm',
  mkv: 'video/x-matroska',
  avi: 'video/x-msvideo',
};

export function contentTypeOf(file: File): string {
  if (file.type) return file.type;
  const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
  return EXTENSION_TYPES[ext] ?? '';
}

/** UUID v4 (crypto.randomUUID is missing on older iPhones). */
export function newMediaId(): string {
  if (typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  const b = crypto.getRandomValues(new Uint8Array(16));
  b[6] = ((b[6] ?? 0) & 0x0f) | 0x40;
  b[8] = ((b[8] ?? 0) & 0x3f) | 0x80;
  const hex = [...b].map((x) => x.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export interface CaptureContext {
  eventId: string;
  spaceId: string;
  visibility: Visibility;
  showName: boolean;
}

export type PreparedCapture =
  | { ok: true; item: QueueItem; data: File }
  | { ok: false; reason: 'tooLarge' | 'unsupported' };

/**
 * A queue item for a file, without EXIF yet (fast, no I/O), so a camera photo
 * can be saved to IndexedDB before anything else (rule 4). The file itself is
 * never changed (rule 3).
 */
export function describeCapture(
  file: File,
  source: QueueItem['source'],
  context: CaptureContext,
  now = Date.now(),
): PreparedCapture {
  const contentType = contentTypeOf(file);
  const type = mediaTypeFor(contentType);
  if (!type || file.size === 0 || (source === 'snapshot' && type !== 'image')) {
    return { ok: false, reason: 'unsupported' };
  }
  if (file.size > MAX_FILE_BYTES) return { ok: false, reason: 'tooLarge' };

  return {
    ok: true,
    data: file,
    item: {
      mediaId: newMediaId(),
      eventId: context.eventId,
      spaceId: context.spaceId,
      source,
      type,
      contentType,
      sizeBytes: file.size,
      fileName: file.name,
      lastModified: file.lastModified,
      // Camera photos are copied into IndexedDB; gallery files stream from the original (U5).
      storage: source === 'snapshot' ? 'stored' : 'picked',
      status: 'waiting',
      priority: type === 'image' ? 0 : 1,
      createdAt: now,
      attempts: 0,
      nextAttemptAt: now,
      lastError: null,
      bytesTransferred: 0,
      resumed: false,
      visibility: context.visibility,
      showName: context.showName,
      // In-app camera photo: taken just now on this phone, until EXIF says otherwise.
      capturedAtMs: source === 'snapshot' ? now : null,
      capturedAtSource: source === 'snapshot' ? 'device' : 'upload',
      width: null,
      height: null,
      meta: { location: null, exif: {}, originalFileName: file.name.slice(0, 255) || null },
      docCreated: false,
      metaWritten: false,
    },
  };
}

/** Details from a photo's EXIF (read in a Web Worker); nothing for videos. */
export async function readCaptureDetails(item: QueueItem, file: Blob): Promise<Partial<QueueItem>> {
  if (item.type !== 'image') return {};
  const { readExif } = await import('../media/exif');
  const result = await readExif(file);
  const exif = result.exif;
  const location =
    result.latitude !== null && result.longitude !== null
      ? { lat: result.latitude, lng: result.longitude, accuracyM: null, source: 'exif' as const }
      : null;
  const exifTime = exifDateToMs(exif.DateTimeOriginal ?? exif.CreateDate, exif.OffsetTimeOriginal);
  return {
    ...(exifTime !== null ? { capturedAtMs: exifTime, capturedAtSource: 'exif' as const } : {}),
    width: typeof exif.ExifImageWidth === 'number' ? exif.ExifImageWidth : null,
    height: typeof exif.ExifImageHeight === 'number' ? exif.ExifImageHeight : null,
    meta: { ...item.meta, location, exif },
  };
}

/** Gallery picks: description plus EXIF, before the "now or later" question. */
export async function prepareCapture(
  file: File,
  source: QueueItem['source'],
  context: CaptureContext,
  now = Date.now(),
): Promise<PreparedCapture> {
  const described = describeCapture(file, source, context, now);
  if (!described.ok) return described;
  return { ...described, item: { ...described.item, ...(await readCaptureDetails(described.item, file)) } };
}
