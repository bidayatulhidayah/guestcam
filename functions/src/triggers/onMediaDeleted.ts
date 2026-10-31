import { derivedPrefixes, firestorePaths, type Media } from '@guestcam/shared';
import { db } from '../firebase';
import { storage } from '../storage';

/**
 * Runs when a media doc is deleted (by its owner or a space owner). Guests
 * cannot delete files themselves, so the server removes the original, every
 * derived copy and the host-only `private/meta` doc (D-062). Deleting what is
 * already gone is fine, so retries are safe.
 */
export async function handleMediaDeleted(eventId: string, mediaId: string, media: Media | undefined): Promise<void> {
  if (!media) return;
  await Promise.all([
    storage.deleteFile(media.originalPath),
    ...derivedPrefixes(eventId, media.ownerUid, mediaId).map((prefix) => storage.deletePrefix(prefix)),
    db.doc(firestorePaths.mediaPrivateMeta(eventId, mediaId)).delete(),
  ]);
}
