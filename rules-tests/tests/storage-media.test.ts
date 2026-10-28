import { storagePaths } from '@guestcam/shared';
import { assertFails, assertSucceeds, type RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { deleteObject, getBytes, getMetadata, ref, uploadBytes, uploadBytesResumable } from 'firebase/storage';
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest';
import { ids, seedBasics } from './fixtures';
import { MEDIA_ID, seedMedia } from './media';
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
  await env.clearStorage();
  await seedBasics(env);
});

const storage = (uid: string | null) =>
  uid === null ? env.unauthenticatedContext().storage() : env.authenticatedContext(uid).storage();
const jpeg = { contentType: 'image/jpeg' };
/** 4 bytes, matching `sizeBytes: 4` in the seeded media doc. */
const photo = new Uint8Array([0xff, 0xd8, 0xff, 0xe0]);
const original = (uid: string, mediaId = MEDIA_ID) => storagePaths.mediaOriginal(ids.event, uid, mediaId);

describe('uploading originals', () => {
  it('the owner uploads after creating the queued doc, with matching size and type', async () => {
    await seedMedia(env, ids.guest);
    await assertSucceeds(uploadBytes(ref(storage(ids.guest), original(ids.guest)), photo, jpeg));
  });

  it('is refused without a media doc (pitfall U2)', async () => {
    await assertFails(uploadBytes(ref(storage(ids.guest), original(ids.guest)), photo, jpeg));
  });

  it('is refused once the doc is no longer queued', async () => {
    await seedMedia(env, ids.guest, MEDIA_ID, { status: 'uploaded' });
    await assertFails(uploadBytes(ref(storage(ids.guest), original(ids.guest)), photo, jpeg));
  });

  it('is refused when size or type differ from the doc', async () => {
    await seedMedia(env, ids.guest);
    await assertFails(uploadBytes(ref(storage(ids.guest), original(ids.guest)), new Uint8Array(5), jpeg));
    await assertFails(
      uploadBytes(ref(storage(ids.guest), original(ids.guest)), photo, { contentType: 'image/png' }),
    );
  });

  it('only images and videos', async () => {
    await seedMedia(env, ids.guest, MEDIA_ID, { contentType: 'application/pdf' });
    await assertFails(
      uploadBytes(ref(storage(ids.guest), original(ids.guest)), photo, { contentType: 'application/pdf' }),
    );
  });

  it('nobody uploads into another guest’s folder or for another guest’s item', async () => {
    await seedMedia(env, ids.guest);
    await assertFails(uploadBytes(ref(storage(ids.otherGuest), original(ids.guest)), photo, jpeg));
    await assertFails(uploadBytes(ref(storage(ids.otherGuest), original(ids.otherGuest)), photo, jpeg));
    await assertFails(uploadBytes(ref(storage(null), original(ids.guest)), photo, jpeg));
  });

  it('originals are never overwritten or deleted by the client (rule 3)', async () => {
    // Its own media id: Storage clean-up between tests can lag in the emulator.
    const id = '2d3e4f5a-6b7c-4d8e-9f0a-1b2c3d4e5f6a';
    const path = original(ids.guest, id);
    await seedMedia(env, ids.guest, id);
    await assertSucceeds(uploadBytes(ref(storage(ids.guest), path), photo, jpeg));
    // Wait until the original is visible (the emulator registers it a moment after the upload resolves).
    await getMetadata(ref(storage(ids.guest), path));
    await assertFails(uploadBytes(ref(storage(ids.guest), path), photo, jpeg));
    await assertFails(uploadBytesResumable(ref(storage(ids.guest), path), photo, jpeg).then());
    await assertFails(deleteObject(ref(storage(ids.guest), path)));
    await assertFails(deleteObject(ref(storage(ids.owner), path)));
  });
});

describe('reading originals', () => {
  beforeEach(async () => {
    await env.withSecurityRulesDisabled(async (context) => {
      await uploadBytes(ref(context.storage(), original(ids.guest)), photo, jpeg);
    });
  });

  it('the owner and space owners only (rule 6: never served in the gallery)', async () => {
    await assertSucceeds(getBytes(ref(storage(ids.guest), original(ids.guest))));
    await assertSucceeds(getBytes(ref(storage(ids.owner), original(ids.guest))));
    await assertFails(getBytes(ref(storage(ids.otherGuest), original(ids.guest))));
    await assertFails(getBytes(ref(storage(ids.moderator), original(ids.guest))));
    await assertFails(getBytes(ref(storage(null), original(ids.guest))));
  });
});
