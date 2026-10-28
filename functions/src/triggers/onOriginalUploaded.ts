import {
  PLAN_LIMITS,
  firestorePaths,
  mediaTypeFor,
  parseOriginalPath,
  type Event,
  type Guest,
  type Media,
  type Space,
} from '@guestcam/shared';
import { Timestamp } from 'firebase-admin/firestore';
import { logger } from 'firebase-functions';
import type { StorageObjectData } from 'firebase-functions/storage';
import { db } from '../firebase';
import { storage } from '../storage';

export type OriginalResult = 'ignored' | 'orphan' | 'alreadyDone' | 'rejected' | 'uploaded';

/**
 * Runs when an original lands in Storage. Only `/original/` paths are handled
 * (pitfall M1) and work already done is skipped (rule 11), so retries are safe.
 * - Moves the media doc from `queued` to `uploaded` with the real size, type,
 *   server upload time and `sortAt = capturedAt ?? uploadedAt` (pitfall M9).
 * - On the guest's first upload, unlocks the gallery (D-005, server-only, D-060).
 * - Rejects files over the plan's limits and deletes them; deletes files that
 *   have no media doc (pitfall U2).
 * Full processing to `ready` (thumbnails, display copies) comes in Phase 3.
 */
export async function handleOriginalUploaded(object: StorageObjectData): Promise<OriginalResult> {
  const parsed = parseOriginalPath(object.name);
  // Folder media arrive with shared folders in Phase 3.
  if (!parsed || parsed.folderId) return 'ignored';
  const { eventId, uid, mediaId } = parsed;
  const sizeBytes = Number(object.size);
  const contentType = object.contentType ?? '';

  const result = await db.runTransaction<OriginalResult>(async (tx) => {
    const mediaRef = db.doc(firestorePaths.media(eventId, mediaId));
    const mediaSnap = await tx.get(mediaRef);
    if (!mediaSnap.exists) return 'orphan';
    const media = mediaSnap.data() as Media;
    if (media.status !== 'queued') return 'alreadyDone';

    const event = (await tx.get(db.doc(firestorePaths.event(eventId)))).data() as Event | undefined;
    const space = event ? ((await tx.get(db.doc(firestorePaths.space(event.spaceId)))).data() as Space | undefined) : undefined;
    const guestRef = db.doc(firestorePaths.guest(eventId, uid));
    const guest = (await tx.get(guestRef)).data() as Partial<Guest> | undefined;
    const now = Timestamp.now();

    const limits = space ? PLAN_LIMITS[space.plan] : null;
    const allowed =
      media.ownerUid === uid &&
      limits !== null &&
      sizeBytes > 0 &&
      sizeBytes <= limits.maxFileBytes &&
      mediaTypeFor(contentType) === media.type &&
      (limits.allowedCaptureFeatures === null || limits.allowedCaptureFeatures.includes(media.source));
    if (!allowed) {
      tx.update(mediaRef, { status: 'failed', updatedAt: now });
      return 'rejected';
    }

    tx.update(mediaRef, {
      status: 'uploaded',
      sizeBytes,
      contentType,
      uploadedAt: now,
      sortAt: media.capturedAt ?? now,
      updatedAt: now,
    });
    if (guest?.galleryUnlocked !== true) {
      // merge: if the guest doc has not synced yet, the app fills in the rest later.
      tx.set(guestRef, { galleryUnlocked: true, firstUploadAt: now }, { merge: true });
    }
    return 'uploaded';
  });

  if (result === 'orphan' || result === 'rejected') {
    await storage.deleteFile(object.name);
    logger.warn('Original removed', { result, path: object.name, sizeBytes, contentType });
  }
  return result;
}
