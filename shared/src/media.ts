import type { CaptureFeatureKey } from './features';
import type { Media, MediaType } from './types';

/**
 * `mediaId`: a UUID made on the phone at capture, used as the doc id and the
 * storage file name, so retries never create duplicates (pitfall U1).
 */
export const MEDIA_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

export function isValidMediaId(id: string): boolean {
  return MEDIA_ID_PATTERN.test(id);
}

/** Every field of a media doc; security rules require exactly these keys on create. */
export const MEDIA_FIELDS = [
  'eventId',
  'spaceId',
  'folderId',
  'ownerUid',
  'source',
  'type',
  'status',
  'visibility',
  'hidden',
  'showName',
  'ownerName',
  'ownerSelfieThumbPath',
  'contentType',
  'sizeBytes',
  'width',
  'height',
  'durationMs',
  'originalPath',
  'displayPath',
  'thumbPath',
  'posterPath',
  'decoration',
  'decoratedPath',
  'capturedAt',
  'capturedAtSource',
  'uploadedAt',
  'sortAt',
  'createdAt',
  'updatedAt',
] as const satisfies readonly (keyof Media)[];

/** Image or video from a MIME type; null for anything else (refused). */
export function mediaTypeFor(contentType: string): Extract<MediaType, 'image' | 'video'> | null {
  if (contentType.startsWith('image/')) return 'image';
  if (contentType.startsWith('video/')) return 'video';
  return null;
}

/** Which media types each Phase 1 capture function may create. */
export const SOURCE_MEDIA_TYPES: Partial<Record<CaptureFeatureKey, readonly MediaType[]>> = {
  snapshot: ['image', 'video'],
  galleryUpload: ['image', 'video'],
};

/**
 * EXIF fields kept in `private/meta` (pitfall M7: raw EXIF such as MakerNote
 * can exceed Firestore's 1 MB document limit). GPS goes to `location`.
 */
export const EXIF_WHITELIST = [
  'Make',
  'Model',
  'LensModel',
  'Software',
  'DateTimeOriginal',
  'OffsetTimeOriginal',
  'CreateDate',
  'Orientation',
  'ExifImageWidth',
  'ExifImageHeight',
  'FNumber',
  'ExposureTime',
  'ISO',
  'FocalLength',
  'Flash',
] as const;
