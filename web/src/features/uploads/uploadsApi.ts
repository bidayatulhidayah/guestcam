/**
 * My Uploads on the server: the guest's own media docs (rules let a guest
 * list only `ownerUid == uid`). Loaded lazily with the page.
 */
import { firestorePaths, type Media, type Visibility } from '@guestcam/shared';
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where,
  type Timestamp,
} from 'firebase/firestore/lite';
import { getDb } from '../../lib/firebase/firestore';
import { loadFirebase } from '../../lib/firebase/load';
import type { ServerItem } from './mergeItems';

export async function listMyServerItems(eventId: string): Promise<ServerItem[]> {
  const { ensureAnonymousUser } = await loadFirebase();
  const { uid } = await ensureAnonymousUser();
  const media = collection(getDb(), 'events', eventId, 'media');
  const snapshot = await getDocs(query(media, where('ownerUid', '==', uid)));
  return snapshot.docs.map((d) => {
    const data = d.data() as Media;
    return {
      mediaId: d.id,
      type: data.type,
      status: data.status,
      visibility: data.visibility,
      showName: data.showName,
      createdAtMs: (data.createdAt as Timestamp | null)?.toMillis() ?? null,
    };
  });
}

export async function setServerVisibility(eventId: string, mediaId: string, visibility: Visibility, showName: boolean) {
  await updateDoc(doc(getDb(), firestorePaths.media(eventId, mediaId)), {
    visibility,
    showName,
    updatedAt: serverTimestamp(),
  });
}

/** The server then removes the item's files and host-only metadata (onMediaDeleted). */
export async function deleteServerItem(eventId: string, mediaId: string) {
  await deleteDoc(doc(getDb(), firestorePaths.media(eventId, mediaId)));
}
