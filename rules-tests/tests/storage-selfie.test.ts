import { storagePaths } from '@guestcam/shared';
import { assertFails, assertSucceeds, type RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { deleteObject, getBytes, ref, uploadBytes } from 'firebase/storage';
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest';
import { ids, seedBasics } from './fixtures';
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
const smallImage = new Uint8Array([0xff, 0xd8, 0xff, 0xe0]);
const selfie = (uid: string) => storagePaths.guestSelfie(ids.event, uid, 'jpg');

async function seedSelfie(uid: string) {
  await env.withSecurityRulesDisabled(async (context) => {
    await uploadBytes(ref(context.storage(), selfie(uid)), smallImage, jpeg);
  });
}

describe('guest selfie', () => {
  it('a member uploads and retakes their own selfie', async () => {
    await assertSucceeds(uploadBytes(ref(storage(ids.guest), selfie(ids.guest)), smallImage, jpeg));
    await assertSucceeds(uploadBytes(ref(storage(ids.guest), selfie(ids.guest)), smallImage, jpeg));
  });

  it('non-members and signed-out visitors cannot upload', async () => {
    await assertFails(uploadBytes(ref(storage(ids.stranger), selfie(ids.stranger)), smallImage, jpeg));
    await assertFails(uploadBytes(ref(storage(null), selfie(ids.guest)), smallImage, jpeg));
  });

  it('nobody uploads into another guest’s folder', async () => {
    await assertFails(uploadBytes(ref(storage(ids.otherGuest), selfie(ids.guest)), smallImage, jpeg));
  });

  it('only images named selfie.* under 15 MB', async () => {
    const guest = storage(ids.guest);
    await assertFails(
      uploadBytes(ref(guest, `events/${ids.event}/guests/${ids.guest}/other.jpg`), smallImage, jpeg),
    );
    await assertFails(uploadBytes(ref(guest, selfie(ids.guest)), smallImage, { contentType: 'video/mp4' }));
    await assertFails(
      uploadBytes(ref(guest, selfie(ids.guest)), new Uint8Array(15 * 1024 * 1024 + 1), jpeg),
    );
  });

  it('readable by the guest and space owners only', async () => {
    await seedSelfie(ids.guest);
    await assertSucceeds(getBytes(ref(storage(ids.guest), selfie(ids.guest))));
    await assertSucceeds(getBytes(ref(storage(ids.owner), selfie(ids.guest))));
    await assertFails(getBytes(ref(storage(ids.otherGuest), selfie(ids.guest))));
    await assertFails(getBytes(ref(storage(ids.moderator), selfie(ids.guest))));
    await assertFails(getBytes(ref(storage(null), selfie(ids.guest))));
  });

  it('cannot be deleted from the client', async () => {
    await seedSelfie(ids.guest);
    await assertFails(deleteObject(ref(storage(ids.guest), selfie(ids.guest))));
  });
});

describe('everything else in Storage', () => {
  it('stays denied until its phase adds rules', async () => {
    const path = `events/${ids.event}/folders/f1/${ids.guest}/original/m1`;
    await assertFails(uploadBytes(ref(storage(ids.guest), path), smallImage, jpeg));
    await assertFails(getBytes(ref(storage(ids.owner), `spaces/${ids.space}/theme/cover.jpg`)));
  });
});
