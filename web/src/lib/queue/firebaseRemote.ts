import { firestorePaths, storagePaths } from '@guestcam/shared';
import { Timestamp, doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore/lite';
import { getDb } from '../firebase/firestore';
import { loadFirebase } from '../firebase/load';
import { storage } from '../storage';
import type { QueueItem, QueueRemote } from './types';

/** The queue's server side: Firestore Lite for the docs, the storage adapter for files (rule 9). */
export const firebaseRemote: QueueRemote = {
  async uid() {
    const { ensureAnonymousUser } = await loadFirebase();
    return (await ensureAnonymousUser()).uid;
  },

  async ensureMediaDoc(item: QueueItem, uid: string) {
    const ref = doc(getDb(), firestorePaths.media(item.eventId, item.mediaId));
    // Created on an earlier attempt whose reply was lost: nothing to do.
    if ((await getDoc(ref)).exists()) return;
    await setDoc(ref, {
      eventId: item.eventId,
      spaceId: item.spaceId,
      folderId: null,
      ownerUid: uid,
      source: item.source,
      type: item.type,
      status: 'queued',
      visibility: item.visibility,
      hidden: false,
      showName: item.showName,
      ownerName: null,
      ownerSelfieThumbPath: null,
      contentType: item.contentType,
      sizeBytes: item.sizeBytes,
      width: item.width,
      height: item.height,
      durationMs: null,
      originalPath: storagePaths.mediaOriginal(item.eventId, uid, item.mediaId),
      displayPath: null,
      thumbPath: null,
      posterPath: null,
      decoration: null,
      decoratedPath: null,
      capturedAt: item.capturedAtMs === null ? null : Timestamp.fromMillis(item.capturedAtMs),
      capturedAtSource: item.capturedAtSource,
      uploadedAt: null,
      sortAt: null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  },

  async writeMeta(item: QueueItem) {
    const ref = doc(getDb(), firestorePaths.mediaPrivateMeta(item.eventId, item.mediaId));
    try {
      await setDoc(ref, item.meta);
    } catch (error) {
      // Rules allow one create only, and guests cannot read it back: a refusal
      // on a later attempt means the first write already landed.
      if (item.attempts > 0 && (error as { code?: string }).code === 'permission-denied') return;
      throw error;
    }
  },

  fileExists: (path) => storage.fileExists(path),

  upload: (path, data, contentType, onProgress, signal) =>
    storage.uploadFile(path, data, {
      contentType,
      signal,
      onProgress: (progress) => onProgress(progress.bytesTransferred),
    }),
};
