import { firestorePaths, storagePaths } from '@guestcam/shared';
import { assertFails, type RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { getBytes, ref, uploadString } from 'firebase/storage';
import { afterAll, beforeAll, describe, it } from 'vitest';
import { createTestEnv } from './setup';

let env: RulesTestEnvironment;

beforeAll(async () => {
  env = await createTestEnv();
});

afterAll(async () => {
  await env.cleanup();
});

describe('Phase 0 deny-all: Firestore', () => {
  it('denies reads and writes for signed-out visitors', async () => {
    const db = env.unauthenticatedContext().firestore();
    await assertFails(getDoc(doc(db, firestorePaths.space('s1'))));
    await assertFails(setDoc(doc(db, firestorePaths.space('s1')), { plan: 'paid' }));
  });

  it('denies reads and writes for signed-in guests, even on their own guest doc', async () => {
    const db = env.authenticatedContext('guest1').firestore();
    await assertFails(getDoc(doc(db, firestorePaths.guest('e1', 'guest1'))));
    await assertFails(setDoc(doc(db, firestorePaths.guest('e1', 'guest1')), { displayName: 'Ali' }));
    await assertFails(getDoc(doc(db, firestorePaths.eventAccess('e1'))));
  });
});

describe('Phase 0 deny-all: Storage', () => {
  it('denies uploads and downloads', async () => {
    const storage = env.authenticatedContext('guest1').storage();
    const path = storagePaths.mediaOriginal('e1', 'guest1', 'm1');
    await assertFails(uploadString(ref(storage, path), 'hello'));
    await assertFails(getBytes(ref(storage, path)));
  });
});
