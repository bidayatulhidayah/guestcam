import { firestorePaths } from '@guestcam/shared';
import { assertFails, assertSucceeds, type RulesTestEnvironment } from '@firebase/rules-unit-testing';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest';
import { ids, seedBasics } from './fixtures';
import { MEDIA_ID, OTHER_MEDIA_ID, seedMedia, validMedia } from './media';
import { createTestEnv } from './setup';

let env: RulesTestEnvironment;

beforeAll(async () => {
  env = await createTestEnv();
});

afterAll(async () => {
  await env.cleanup();
});

beforeEach(async () => {
  await env.clearFirestore();
  await seedBasics(env);
});

const db = (uid: string | null) =>
  uid === null ? env.unauthenticatedContext().firestore() : env.authenticatedContext(uid).firestore();
const mediaDoc = (as: string | null, mediaId = MEDIA_ID) => doc(db(as), firestorePaths.media(ids.event, mediaId));
const metaDoc = (as: string | null, mediaId = MEDIA_ID) =>
  doc(db(as), firestorePaths.mediaPrivateMeta(ids.event, mediaId));

async function patchAsAdmin(path: string, data: Record<string, unknown>) {
  await env.withSecurityRulesDisabled(async (context) => {
    await setDoc(doc(context.firestore(), path), data, { merge: true });
  });
}

describe('creating media docs', () => {
  it('a member creates a queued snapshot photo', async () => {
    await assertSucceeds(setDoc(mediaDoc(ids.guest), validMedia(ids.guest)));
  });

  it('a member creates a queued gallery video with unknown capture time', async () => {
    await assertSucceeds(
      setDoc(
        mediaDoc(ids.guest),
        validMedia(ids.guest, MEDIA_ID, {
          source: 'galleryUpload',
          type: 'video',
          contentType: 'video/quicktime',
          sizeBytes: 3_000_000_000,
          width: null,
          height: null,
          capturedAt: null,
          capturedAtSource: 'upload',
        }),
      ),
    );
  });

  it('non-members and signed-out visitors cannot create', async () => {
    await assertFails(setDoc(mediaDoc(ids.stranger), validMedia(ids.stranger)));
    await assertFails(setDoc(mediaDoc(null), validMedia(ids.guest)));
  });

  it('nobody creates an item owned by someone else', async () => {
    await assertFails(setDoc(mediaDoc(ids.guest), validMedia(ids.otherGuest)));
  });

  it('rejects wrong sources, types, statuses and server fields', async () => {
    const bad: Record<string, unknown>[] = [
      { source: 'snapshot', type: 'video', contentType: 'video/mp4' },
      { source: 'videoWish', type: 'video', contentType: 'video/mp4' },
      { type: 'audio', contentType: 'audio/mp4' },
      { contentType: 'video/mp4' },
      { status: 'ready' },
      { hidden: true },
      { visibility: 'everyone' },
      { ownerName: 'Mak Long' },
      { uploadedAt: Timestamp.now() },
      { sortAt: Timestamp.now() },
      { thumbPath: 'x' },
      { decoration: { nameStamp: true, frameId: null, filterId: null } },
      { folderId: 'f1' },
      { spaceId: ids.otherSpace },
      { eventId: ids.otherEvent },
      { sizeBytes: 0 },
      { sizeBytes: 4 * 1024 * 1024 * 1024 + 1 },
      { sizeBytes: 1.5 },
      { capturedAtSource: 'guess' },
      { createdAt: Timestamp.fromMillis(0) },
      { originalPath: `events/${ids.event}/media/${ids.otherGuest}/original/${MEDIA_ID}` },
      { originalPath: `events/${ids.event}/media/${ids.guest}/original/${OTHER_MEDIA_ID}` },
      { isPublicByDefault: true },
    ];
    for (const overrides of bad) {
      await assertFails(setDoc(mediaDoc(ids.guest), validMedia(ids.guest, MEDIA_ID, overrides)));
    }
  });

  it('requires every field', async () => {
    const { width: _width, ...missing } = validMedia(ids.guest);
    await assertFails(setDoc(mediaDoc(ids.guest), missing));
  });

  it('requires a UUID media id', async () => {
    await assertFails(
      setDoc(doc(db(ids.guest), firestorePaths.media(ids.event, 'photo1')), validMedia(ids.guest, 'photo1')),
    );
  });

  it('is refused when the event switched the feature off (rule 17)', async () => {
    await patchAsAdmin(firestorePaths.event(ids.event), { enabledFeatures: { snapshot: false } });
    await assertFails(setDoc(mediaDoc(ids.guest), validMedia(ids.guest)));
  });

  it('is refused when the space is not entitled to the feature (rule 17)', async () => {
    await env.withSecurityRulesDisabled(async (context) => {
      await updateDoc(doc(context.firestore(), firestorePaths.space(ids.space)), { 'entitlements.snapshot': false });
    });
    await assertFails(setDoc(mediaDoc(ids.guest), validMedia(ids.guest)));
  });

  it('is refused after the upload window closes', async () => {
    await patchAsAdmin(firestorePaths.event(ids.event), { uploadUntil: Timestamp.fromMillis(Date.now() - 1000) });
    await assertFails(setDoc(mediaDoc(ids.guest), validMedia(ids.guest)));
  });
});

describe('checking before creating (upload queue retries, pitfall U1)', () => {
  it('a member may see that an item does not exist yet', async () => {
    await assertSucceeds(getDoc(mediaDoc(ids.guest)));
  });

  it('non-members get nothing, not even that', async () => {
    await assertFails(getDoc(mediaDoc(ids.stranger)));
    await assertFails(getDoc(mediaDoc(null)));
  });

  it('once it exists, another guest still cannot read it', async () => {
    await seedMedia(env, ids.guest);
    await assertFails(getDoc(mediaDoc(ids.otherGuest)));
  });
});

describe('reading media docs', () => {
  beforeEach(async () => {
    await seedMedia(env, ids.guest);
    await seedMedia(env, ids.otherGuest, OTHER_MEDIA_ID);
  });

  it('the owner and space owners read an item; other guests and moderators cannot', async () => {
    await assertSucceeds(getDoc(mediaDoc(ids.guest)));
    await assertSucceeds(getDoc(mediaDoc(ids.owner)));
    await assertFails(getDoc(mediaDoc(ids.otherGuest)));
    await assertFails(getDoc(mediaDoc(ids.moderator)));
    await assertFails(getDoc(mediaDoc(null)));
  });

  it('even public items stay unreadable to other guests until the gallery (Phase 3)', async () => {
    await patchAsAdmin(firestorePaths.media(ids.event, MEDIA_ID), { visibility: 'public', status: 'ready' });
    await assertFails(getDoc(mediaDoc(ids.otherGuest)));
  });

  it('My Uploads may list only the guest’s own items', async () => {
    const media = collection(db(ids.guest), 'events', ids.event, 'media');
    await assertSucceeds(getDocs(query(media, where('ownerUid', '==', ids.guest))));
    await assertFails(getDocs(media));
    await assertFails(getDocs(query(media, where('ownerUid', '==', ids.otherGuest))));
  });
});

describe('updating and deleting media docs', () => {
  beforeEach(async () => {
    await seedMedia(env, ids.guest);
  });

  it('the owner switches private/public and show-name', async () => {
    await assertSucceeds(
      updateDoc(mediaDoc(ids.guest), { visibility: 'public', showName: true, updatedAt: serverTimestamp() }),
    );
  });

  it('the owner cannot change anything else', async () => {
    for (const change of [
      { status: 'ready' },
      { hidden: false, updatedAt: serverTimestamp(), sizeBytes: 9 },
      { ownerName: 'x', updatedAt: serverTimestamp() },
      { visibility: 'public' },
    ]) {
      await assertFails(updateDoc(mediaDoc(ids.guest), change));
    }
  });

  it('My Uploads: after the server marked it uploaded, the owner still switches it both ways and deletes it', async () => {
    await patchAsAdmin(firestorePaths.media(ids.event, MEDIA_ID), { status: 'uploaded' });
    await assertSucceeds(
      updateDoc(mediaDoc(ids.guest), { visibility: 'public', showName: true, updatedAt: serverTimestamp() }),
    );
    await assertSucceeds(
      updateDoc(mediaDoc(ids.guest), { visibility: 'private', showName: false, updatedAt: serverTimestamp() }),
    );
    await assertFails(updateDoc(mediaDoc(ids.otherGuest), { visibility: 'public', updatedAt: serverTimestamp() }));
    await assertFails(getDoc(mediaDoc(ids.otherGuest)));
    await assertSucceeds(deleteDoc(mediaDoc(ids.guest)));
  });

  it('other guests cannot change an item', async () => {
    await assertFails(updateDoc(mediaDoc(ids.otherGuest), { visibility: 'public', updatedAt: serverTimestamp() }));
  });

  it('the owner or a space owner deletes; others cannot', async () => {
    await assertFails(deleteDoc(mediaDoc(ids.otherGuest)));
    await assertFails(deleteDoc(mediaDoc(ids.moderator)));
    await assertSucceeds(deleteDoc(mediaDoc(ids.guest)));
    await seedMedia(env, ids.guest);
    await assertSucceeds(deleteDoc(mediaDoc(ids.owner)));
  });
});

describe('private/meta (location and EXIF)', () => {
  const meta = {
    location: { lat: 3.139, lng: 101.6869, accuracyM: null, source: 'exif' },
    exif: { Make: 'Apple', Model: 'iPhone 15' },
    originalFileName: 'IMG_0001.HEIC',
  };

  beforeEach(async () => {
    await seedMedia(env, ids.guest);
  });

  it('the item’s owner writes it once', async () => {
    await assertSucceeds(setDoc(metaDoc(ids.guest), meta));
    await assertFails(setDoc(metaDoc(ids.guest), meta));
    await assertFails(updateDoc(metaDoc(ids.guest), { originalFileName: 'x' }));
  });

  it('nobody else writes it, and only the doc named "meta"', async () => {
    await assertFails(setDoc(metaDoc(ids.otherGuest), meta));
    await assertFails(
      setDoc(doc(db(ids.guest), `${firestorePaths.media(ids.event, MEDIA_ID)}/private/extra`), meta),
    );
  });

  it('rejects unexpected fields and bad locations', async () => {
    for (const bad of [
      { ...meta, deviceId: 'x' },
      { ...meta, location: { lat: '3', lng: 101, accuracyM: null, source: 'exif' } },
      { ...meta, location: { lat: 3, lng: 101, accuracyM: null, source: 'guess' } },
      { location: null, exif: {} },
    ]) {
      await assertFails(setDoc(metaDoc(ids.guest), bad));
    }
  });

  it('only space owners can read it, not even the guest who sent it (rule 10)', async () => {
    await assertSucceeds(setDoc(metaDoc(ids.guest), meta));
    await assertSucceeds(getDoc(metaDoc(ids.owner)));
    await assertFails(getDoc(metaDoc(ids.guest)));
    await assertFails(getDoc(metaDoc(ids.otherGuest)));
    await assertFails(getDoc(metaDoc(ids.moderator)));
  });
});
