import { firestorePaths } from '@guestcam/shared';
import { assertFails, assertSucceeds, type RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { deleteDoc, doc, getDoc, serverTimestamp, setDoc, Timestamp, updateDoc } from 'firebase/firestore';
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
  await seedBasics(env);
});

const db = (uid: string | null) =>
  uid === null ? env.unauthenticatedContext().firestore() : env.authenticatedContext(uid).firestore();

function validGuest(uid: string, eventId = ids.event) {
  return {
    displayName: 'Mak Long',
    selfiePath: `events/${eventId}/guests/${uid}/selfie.jpg`,
    selfieThumbPath: null,
    galleryUnlocked: false,
    firstUploadAt: null,
    lastVisibility: null,
    showName: true,
    language: 'ms',
    joinedAt: serverTimestamp(),
  };
}

describe('spaces and server-only collections', () => {
  it('only space owners read the space doc (plan, number, entitlements)', async () => {
    await assertSucceeds(getDoc(doc(db(ids.owner), firestorePaths.space(ids.space))));
    await assertFails(getDoc(doc(db(ids.guest), firestorePaths.space(ids.space))));
    await assertFails(getDoc(doc(db(ids.moderator), firestorePaths.space(ids.space))));
    await assertFails(getDoc(doc(db(null), firestorePaths.space(ids.space))));
  });

  it('a superadmin reads any space', async () => {
    const admin = env.authenticatedContext('admin1', { superadmin: true }).firestore();
    await assertSucceeds(getDoc(doc(admin, firestorePaths.space(ids.space))));
  });

  it('nobody writes spaces from the client', async () => {
    await assertFails(setDoc(doc(db(ids.owner), firestorePaths.space(ids.space)), { plan: 'paid' }, { merge: true }));
  });

  it('hosts can read their own host doc only', async () => {
    await assertSucceeds(getDoc(doc(db(ids.moderator), firestorePaths.spaceHost(ids.space, ids.moderator))));
    await assertFails(getDoc(doc(db(ids.guest), firestorePaths.spaceHost(ids.space, ids.owner))));
  });

  it('publicIds, counters, alias bookings and rate limits are server-only', async () => {
    for (const path of [
      firestorePaths.publicId(ids.publicId),
      firestorePaths.spaceCounter(),
      firestorePaths.aliasBooking('b1'),
      firestorePaths.rateLimit('device_x'),
    ]) {
      await assertFails(getDoc(doc(db(ids.owner), path)));
      await assertFails(setDoc(doc(db(ids.guest), path), { x: 1 }));
    }
  });

  it('the audit log is readable by space owners only', async () => {
    await assertSucceeds(getDoc(doc(db(ids.owner), firestorePaths.auditLogEntry('entry1'))));
    await assertFails(getDoc(doc(db(ids.guest), firestorePaths.auditLogEntry('entry1'))));
  });

  it('the catalog is public and read-only', async () => {
    await assertSucceeds(getDoc(doc(db(null), firestorePaths.catalog())));
    await assertFails(setDoc(doc(db(ids.owner), firestorePaths.catalog()), { currency: 'MYR' }));
  });
});

describe('events', () => {
  it('members and space owners read the event', async () => {
    await assertSucceeds(getDoc(doc(db(ids.guest), firestorePaths.event(ids.event))));
    await assertSucceeds(getDoc(doc(db(ids.owner), firestorePaths.event(ids.event))));
  });

  it('non-members, signed-out visitors and moderators cannot read it', async () => {
    await assertFails(getDoc(doc(db(ids.stranger), firestorePaths.event(ids.event))));
    await assertFails(getDoc(doc(db(null), firestorePaths.event(ids.event))));
    await assertFails(getDoc(doc(db(ids.moderator), firestorePaths.event(ids.event))));
  });

  it('a member of one event cannot read another event', async () => {
    await assertFails(getDoc(doc(db(ids.guest), firestorePaths.event(ids.otherEvent))));
  });

  it('owners of one space cannot read events of another space', async () => {
    await assertFails(getDoc(doc(db(ids.owner), firestorePaths.event(ids.otherEvent))));
  });

  it('the event code is never readable, not even by owners', async () => {
    await assertFails(getDoc(doc(db(ids.guest), firestorePaths.eventAccess(ids.event))));
    await assertFails(getDoc(doc(db(ids.owner), firestorePaths.eventAccess(ids.event))));
  });

  it('nobody writes events from the client', async () => {
    await assertFails(updateDoc(doc(db(ids.guest), firestorePaths.event(ids.event)), { status: 'closed' }));
  });
});

describe('members', () => {
  it('a guest reads their own membership; owners read all', async () => {
    await assertSucceeds(getDoc(doc(db(ids.guest), firestorePaths.eventMember(ids.event, ids.guest))));
    await assertSucceeds(getDoc(doc(db(ids.owner), firestorePaths.eventMember(ids.event, ids.guest))));
    await assertFails(getDoc(doc(db(ids.otherGuest), firestorePaths.eventMember(ids.event, ids.guest))));
  });

  it('nobody can join by writing a member doc', async () => {
    await assertFails(
      setDoc(doc(db(ids.stranger), firestorePaths.eventMember(ids.event, ids.stranger)), {
        joinedAt: serverTimestamp(),
        via: 'code',
      }),
    );
  });
});

describe('guests', () => {
  const guestDoc = (uid: string, as = uid) => doc(db(as), firestorePaths.guest(ids.event, uid));

  it('a member creates their own guest profile', async () => {
    await assertSucceeds(setDoc(guestDoc(ids.guest), validGuest(ids.guest)));
  });

  it('a member may skip the selfie', async () => {
    await assertSucceeds(setDoc(guestDoc(ids.guest), { ...validGuest(ids.guest), selfiePath: null }));
  });

  it('a non-member cannot create a profile', async () => {
    await assertFails(setDoc(guestDoc(ids.stranger), validGuest(ids.stranger)));
  });

  it('nobody creates a profile for someone else', async () => {
    await assertFails(setDoc(guestDoc(ids.otherGuest, ids.guest), validGuest(ids.otherGuest)));
  });

  it('a guest cannot unlock the gallery themselves (P3)', async () => {
    await assertFails(setDoc(guestDoc(ids.guest), { ...validGuest(ids.guest), galleryUnlocked: true }));
    await assertFails(setDoc(guestDoc(ids.guest), { ...validGuest(ids.guest), firstUploadAt: Timestamp.now() }));
  });

  it('rejects bad or extra fields', async () => {
    const bad = [
      { ...validGuest(ids.guest), displayName: '' },
      { ...validGuest(ids.guest), displayName: 'x'.repeat(41) },
      { ...validGuest(ids.guest), selfiePath: `events/${ids.event}/guests/${ids.otherGuest}/selfie.jpg` },
      { ...validGuest(ids.guest), selfiePath: `events/${ids.event}/media/${ids.guest}/original/m1` },
      { ...validGuest(ids.guest), lastVisibility: 'everyone' },
      { ...validGuest(ids.guest), language: 'fr' },
      { ...validGuest(ids.guest), joinedAt: Timestamp.fromMillis(0) },
      { ...validGuest(ids.guest), selfieThumbPath: 'x' },
      { ...validGuest(ids.guest), isHost: true },
    ];
    for (const data of bad) await assertFails(setDoc(guestDoc(ids.guest), data));
  });

  it('a guest updates their name, privacy choice and language only', async () => {
    await env.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), firestorePaths.guest(ids.event, ids.guest)), {
        ...validGuest(ids.guest),
        joinedAt: Timestamp.now(),
      });
    });
    await assertSucceeds(updateDoc(guestDoc(ids.guest), { displayName: 'Pak Long', lastVisibility: 'public' }));
    await assertSucceeds(updateDoc(guestDoc(ids.guest), { language: 'en', showName: false, selfiePath: null }));
    await assertFails(updateDoc(guestDoc(ids.guest), { galleryUnlocked: true }));
    await assertFails(updateDoc(guestDoc(ids.guest), { joinedAt: Timestamp.now() }));
    await assertFails(updateDoc(guestDoc(ids.guest, ids.otherGuest), { displayName: 'Hacker' }));
    await assertFails(deleteDoc(guestDoc(ids.guest)));
  });

  it('profiles are readable by that guest and owners only (P2)', async () => {
    await env.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), firestorePaths.guest(ids.event, ids.guest)), {
        ...validGuest(ids.guest),
        joinedAt: Timestamp.now(),
      });
    });
    await assertSucceeds(getDoc(guestDoc(ids.guest)));
    await assertSucceeds(getDoc(guestDoc(ids.guest, ids.owner)));
    await assertFails(getDoc(guestDoc(ids.guest, ids.otherGuest)));
    await assertFails(getDoc(guestDoc(ids.guest, ids.moderator)));
  });
});
