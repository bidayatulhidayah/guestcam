import { firestorePaths, storagePaths } from '@guestcam/shared';
import type { RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { doc, serverTimestamp, setDoc, Timestamp } from 'firebase/firestore';
import { ids } from './fixtures';

export const MEDIA_ID = '0b9a2c4e-5f61-4a7b-8c9d-0e1f2a3b4c5d';
export const OTHER_MEDIA_ID = '1c2d3e4f-5a6b-4c7d-8e9f-0a1b2c3d4e5f';

/** A valid queued media doc as the web app creates it (before upload). */
export function validMedia(uid: string, mediaId = MEDIA_ID, overrides: Record<string, unknown> = {}) {
  return {
    eventId: ids.event,
    spaceId: ids.space,
    folderId: null,
    ownerUid: uid,
    source: 'snapshot',
    type: 'image',
    status: 'queued',
    visibility: 'private',
    hidden: false,
    showName: false,
    ownerName: null,
    ownerSelfieThumbPath: null,
    contentType: 'image/jpeg',
    sizeBytes: 4,
    width: 4032,
    height: 3024,
    durationMs: null,
    originalPath: storagePaths.mediaOriginal(ids.event, uid, mediaId),
    displayPath: null,
    thumbPath: null,
    posterPath: null,
    decoration: null,
    decoratedPath: null,
    capturedAt: Timestamp.fromMillis(Date.now() - 60_000),
    capturedAtSource: 'exif',
    uploadedAt: null,
    sortAt: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    ...overrides,
  };
}

/** Writes a media doc with rules disabled (timestamps resolved). */
export async function seedMedia(
  env: RulesTestEnvironment,
  uid: string,
  mediaId = MEDIA_ID,
  overrides: Record<string, unknown> = {},
) {
  await env.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), firestorePaths.media(ids.event, mediaId)), {
      ...validMedia(uid, mediaId, overrides),
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      ...overrides,
    });
  });
}
