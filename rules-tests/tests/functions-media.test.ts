/**
 * Upload and delete triggers through the emulators: a guest creates the
 * queued doc and uploads the original exactly as the web app does.
 */
import { firestorePaths, storagePaths, type Guest, type Media } from '@guestcam/shared';
import type { RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { deleteDoc, doc, getDoc, setDoc, Timestamp, updateDoc } from 'firebase/firestore';
import { getMetadata, ref, uploadBytes } from 'firebase/storage';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { ids, seedBasics } from './fixtures';
import { closeGuests, eventually, newGuest } from './guestClient';
import { validMedia } from './media';
import { PROJECT_ID, createTestEnv } from './setup';

let env: RulesTestEnvironment;

beforeAll(async () => {
  env = await createTestEnv();
});

afterAll(async () => {
  await env.cleanup();
});

beforeEach(async () => {
  await env.clearFirestore();
  await env.clearStorage();
  await seedBasics(env);
});

afterEach(async () => {
  await closeGuests();
});

const photo = new Uint8Array([0xff, 0xd8, 0xff, 0xe0]);
/** The project's default bucket: where the app uploads and the trigger listens. */
const BUCKET = `gs://${PROJECT_ID}.appspot.com`;

async function adminGet<T>(path: string): Promise<T | undefined> {
  let data: T | undefined;
  await env.withSecurityRulesDisabled(async (context) => {
    data = (await getDoc(doc(context.firestore(), path))).data() as T | undefined;
  });
  return data;
}

async function fileExists(path: string): Promise<boolean> {
  let found = false;
  await env.withSecurityRulesDisabled(async (context) => {
    found = await getMetadata(ref(context.storage(BUCKET), path)).then(
      () => true,
      () => false,
    );
  });
  return found;
}

/** A joined guest who creates a queued item and uploads its original. */
async function guestUploads(mediaId: string, overrides: Record<string, unknown> = {}) {
  const guest = await newGuest();
  await guest.join({ publicId: ids.publicId, eventSlug: 'tunang', code: 'k7q2' });
  const media = validMedia(guest.uid, mediaId, overrides);
  await setDoc(doc(guest.db, firestorePaths.media(ids.event, mediaId)), media);
  await uploadBytes(ref(guest.storage, storagePaths.mediaOriginal(ids.event, guest.uid, mediaId)), photo, {
    contentType: media.contentType as string,
  });
  return guest;
}

const statusOf = (mediaId: string, wanted: Media['status']) => async () => {
  const media = await adminGet<Media>(firestorePaths.media(ids.event, mediaId));
  return media?.status === wanted ? media : undefined;
};

describe('onOriginalUploaded', () => {
  it('marks the item uploaded with server time and unlocks the gallery on the first upload', async () => {
    const mediaId = 'a1a1a1a1-0000-4000-8000-000000000001';
    const guest = await guestUploads(mediaId);
    const media = await eventually(statusOf(mediaId, 'uploaded'));
    expect(media.sizeBytes).toBe(4);
    expect(media.uploadedAt).not.toBeNull();
    // sortAt = capturedAt when known (pitfall M9).
    expect((media.sortAt as unknown as Timestamp).toMillis()).toBe(
      (media.capturedAt as unknown as Timestamp).toMillis(),
    );
    const unlocked = await eventually(async () => {
      const g = await adminGet<Guest>(firestorePaths.guest(ids.event, guest.uid));
      return g?.galleryUnlocked === true ? g : undefined;
    });
    expect(unlocked.firstUploadAt).not.toBeNull();
  });

  it('uses the upload time when there is no capture time, and keeps the first unlock time', async () => {
    const first = 'a1a1a1a1-0000-4000-8000-000000000002';
    const guest = await guestUploads(first, { capturedAt: null, capturedAtSource: 'upload' });
    const media = await eventually(statusOf(first, 'uploaded'));
    expect((media.sortAt as unknown as Timestamp).toMillis()).toBe(
      (media.uploadedAt as unknown as Timestamp).toMillis(),
    );
    const firstUnlock = (await eventually(async () =>
      (await adminGet<Guest>(firestorePaths.guest(ids.event, guest.uid)))?.firstUploadAt ?? undefined,
    )) as unknown as Timestamp;

    const second = 'a1a1a1a1-0000-4000-8000-000000000003';
    await setDoc(doc(guest.db, firestorePaths.media(ids.event, second)), validMedia(guest.uid, second));
    await uploadBytes(ref(guest.storage, storagePaths.mediaOriginal(ids.event, guest.uid, second)), photo, {
      contentType: 'image/jpeg',
    });
    await eventually(statusOf(second, 'uploaded'));
    const after = await adminGet<Guest>(firestorePaths.guest(ids.event, guest.uid));
    expect((after?.firstUploadAt as unknown as Timestamp).toMillis()).toBe(firstUnlock.toMillis());
  });

  it('rejects a file the plan does not allow and deletes it', async () => {
    // Demo spaces allow only snapshot and video wishes (limits.ts).
    await env.withSecurityRulesDisabled(async (context) => {
      await updateDoc(doc(context.firestore(), firestorePaths.space(ids.space)), { plan: 'demo' });
    });
    const mediaId = 'a1a1a1a1-0000-4000-8000-000000000004';
    const guest = await guestUploads(mediaId, { source: 'galleryUpload' });
    await eventually(statusOf(mediaId, 'failed'));
    await eventually(async () =>
      (await fileExists(storagePaths.mediaOriginal(ids.event, guest.uid, mediaId))) ? undefined : true,
    );
    // A rejected file does not unlock the gallery.
    expect((await adminGet<Guest>(firestorePaths.guest(ids.event, guest.uid)))?.galleryUnlocked).not.toBe(true);
  });

  it('deletes an original that has no media doc (pitfall U2)', async () => {
    const path = storagePaths.mediaOriginal(ids.event, 'nobody', 'a1a1a1a1-0000-4000-8000-000000000005');
    await env.withSecurityRulesDisabled(async (context) => {
      await uploadBytes(ref(context.storage(BUCKET), path), photo, { contentType: 'image/jpeg' });
    });
    await eventually(async () => ((await fileExists(path)) ? undefined : true));
  });

  it('removes a file that lands after its item was deleted mid-upload, and does not bring the item back', async () => {
    const mediaId = 'a1a1a1a1-0000-4000-8000-000000000007';
    const guest = await newGuest();
    await guest.join({ publicId: ids.publicId, eventSlug: 'tunang', code: 'k7q2' });
    await setDoc(doc(guest.db, firestorePaths.media(ids.event, mediaId)), validMedia(guest.uid, mediaId));
    // The guest deletes the item in My Uploads while its upload is still running...
    await deleteDoc(doc(guest.db, firestorePaths.media(ids.event, mediaId)));
    // ...and the upload, started while the doc existed, finishes afterwards.
    const path = storagePaths.mediaOriginal(ids.event, guest.uid, mediaId);
    await env.withSecurityRulesDisabled(async (context) => {
      await uploadBytes(ref(context.storage(BUCKET), path), photo, { contentType: 'image/jpeg' });
    });
    await eventually(async () => ((await fileExists(path)) ? undefined : true));
    expect(await adminGet(firestorePaths.media(ids.event, mediaId))).toBeUndefined();
  });

  it('ignores files outside /original/ (pitfall M1)', async () => {
    const path = storagePaths.mediaDerived(ids.event, 'nobody', 'a1a1a1a1-0000-4000-8000-000000000006', 'thumb', 'webp');
    await env.withSecurityRulesDisabled(async (context) => {
      await uploadBytes(ref(context.storage(BUCKET), path), photo, { contentType: 'image/webp' });
    });
    await new Promise((resolve) => setTimeout(resolve, 2000));
    expect(await fileExists(path)).toBe(true);
  });
});

describe('onMediaDeleted', () => {
  it('removes the original, derived copies and private/meta when the owner deletes the item', async () => {
    const mediaId = 'b2b2b2b2-0000-4000-8000-000000000001';
    const guest = await guestUploads(mediaId);
    await eventually(statusOf(mediaId, 'uploaded'));
    await setDoc(doc(guest.db, firestorePaths.mediaPrivateMeta(ids.event, mediaId)), {
      location: null,
      exif: { Make: 'Apple' },
      originalFileName: 'IMG_0001.JPG',
    });
    const thumb = storagePaths.mediaDerived(ids.event, guest.uid, mediaId, 'thumb', 'webp');
    await env.withSecurityRulesDisabled(async (context) => {
      await uploadBytes(ref(context.storage(BUCKET), thumb), photo, { contentType: 'image/webp' });
    });

    await deleteDoc(doc(guest.db, firestorePaths.media(ids.event, mediaId)));

    const original = storagePaths.mediaOriginal(ids.event, guest.uid, mediaId);
    await eventually(async () => ((await fileExists(original)) ? undefined : true));
    await eventually(async () => ((await fileExists(thumb)) ? undefined : true));
    await eventually(async () =>
      (await adminGet(firestorePaths.mediaPrivateMeta(ids.event, mediaId))) ? undefined : true,
    );
  });
});
