/**
 * Where the My Uploads item view shows a guest's own photo or video from
 * (D-091, D-093): this phone's copy while it is still here (not sent yet, or
 * picked on this page), otherwise the original on the server, which only its
 * owner may read (storage.rules). Loaded lazily with the item view.
 */
import { storagePaths } from '@guestcam/shared';
import { loadFirebase } from '../../lib/firebase/load';
import { getQueue, getQueueDb } from '../../lib/queue';
import { storage } from '../../lib/storage';

export interface OriginalSource {
  url: string;
  /** An object URL to revoke when the player closes. */
  local: boolean;
}

export async function originalSource(eventId: string, mediaId: string): Promise<OriginalSource> {
  const stored = (await (await getQueueDb()).blobs.get(mediaId))?.blob ?? (await getQueue()).files.get(mediaId);
  // An object URL streams from the stored file: the video is never read into memory.
  if (stored) return { url: URL.createObjectURL(stored), local: true };
  const { ensureAnonymousUser } = await loadFirebase();
  const { uid } = await ensureAnonymousUser();
  return { url: await storage.getDownloadUrl(storagePaths.mediaOriginal(eventId, uid, mediaId)), local: false };
}
