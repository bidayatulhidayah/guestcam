/**
 * resolveCurrentEvent and joinEvent, called through the Functions emulator
 * exactly as the web app calls them (anonymous guest, callable SDK).
 */
import { EVENT_CODE_RATE_LIMITS, firestorePaths } from '@guestcam/shared';
import type { RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { collection, doc, getDoc, getDocs, setDoc, Timestamp } from 'firebase/firestore';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { ids, seedBasics } from './fixtures';
import { closeGuests, newGuest } from './guestClient';
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
  await seedMoreEvents();
});

afterEach(async () => {
  await closeGuests();
});

const HOUR = 3_600_000;

/** A second open event and a draft in space1. Codes are unique within the space. */
async function seedMoreEvents() {
  await env.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();
    const base = (await getDoc(doc(db, firestorePaths.event(ids.event)))).data()!;
    await setDoc(doc(db, firestorePaths.event('event3')), {
      ...base,
      eventSlug: 'nikah',
      startAt: Timestamp.fromMillis(Date.now() + 3 * 24 * HOUR),
      endAt: Timestamp.fromMillis(Date.now() + 3 * 24 * HOUR + 4 * HOUR),
    });
    await setDoc(doc(db, firestorePaths.eventAccess('event3')), { code: 'm4p8', linkedEventIds: [] });
    await setDoc(doc(db, firestorePaths.event('event4')), { ...base, eventSlug: 'draf', status: 'draft' });
    await setDoc(doc(db, firestorePaths.eventAccess('event4')), { code: 'd2d2', linkedEventIds: [] });
  });
}

async function readAsAdmin(path: string) {
  let data: Record<string, unknown> | undefined;
  await env.withSecurityRulesDisabled(async (context) => {
    data = (await getDoc(doc(context.firestore(), path))).data();
  });
  return data;
}

describe('joinEvent', () => {
  it('joins with the QR slug and an uppercase code', async () => {
    const guest = await newGuest();
    const result = await guest.join({ publicId: ids.publicId, eventSlug: 'tunang', code: 'K7Q2' });
    expect(result.kind).toBe('joined');
    if (result.kind !== 'joined') return;
    expect(result.event).toMatchObject({ eventId: ids.event, eventSlug: 'tunang', displayNames: 'Ali & Siti' });
    expect(result.event.features).toContain('snapshot');
    // Never sent to guests.
    const json = JSON.stringify(result);
    for (const secret of ['10001', 'beta', 'k7q2', 'spaceNumber', 'entitlements', 'startAt']) {
      expect(json).not.toContain(secret);
    }
    expect(await readAsAdmin(firestorePaths.eventMember(ids.event, guest.uid))).toMatchObject({ via: 'code' });
  });

  it('matches a typed code across the space when there is no slug', async () => {
    const guest = await newGuest();
    const result = await guest.join({ publicId: ids.publicId, code: 'm4p8' });
    expect(result).toMatchObject({ kind: 'joined', event: { eventSlug: 'nikah' } });
  });

  it('answers wrongCode the same way for a wrong code, an unknown space and the wrong slug', async () => {
    const guest = await newGuest();
    expect(await guest.join({ publicId: ids.publicId, eventSlug: 'tunang', code: 'aaaa' })).toEqual({
      kind: 'wrongCode',
    });
    expect(await guest.join({ publicId: 'zzzzzzz', code: 'k7q2' })).toEqual({ kind: 'wrongCode' });
    expect(await guest.join({ publicId: ids.publicId, eventSlug: 'nikah', code: 'k7q2' })).toEqual({
      kind: 'wrongCode',
    });
    expect(await guest.join({ publicId: ids.publicId, code: 'd2d2' })).toEqual({ kind: 'wrongCode' });
    expect(await readAsAdmin(firestorePaths.eventMember(ids.event, guest.uid))).toBeUndefined();
  });

  it('a code from another space does not open this one', async () => {
    const guest = await newGuest();
    await env.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), firestorePaths.eventAccess(ids.otherEvent)), {
        code: 'q8r9',
        linkedEventIds: [],
      });
    });
    expect(await guest.join({ publicId: ids.publicId, code: 'q8r9' })).toEqual({ kind: 'wrongCode' });
  });

  it('locks a device after 5 wrong codes, even for the right code', async () => {
    const guest = await newGuest();
    const wrong = { publicId: ids.publicId, eventSlug: 'tunang', code: 'aaaa' };
    for (let i = 1; i < EVENT_CODE_RATE_LIMITS.device.maxFailures; i++) {
      expect((await guest.join(wrong)).kind).toBe('wrongCode');
    }
    const fifth = await guest.join(wrong);
    expect(fifth).toEqual({ kind: 'tooManyTries', retryAfterMs: EVENT_CODE_RATE_LIMITS.device.lockMs });
    const right = await guest.join({ ...wrong, code: 'k7q2' });
    expect(right.kind).toBe('tooManyTries');
    // Another phone is not affected by this device's lock.
    expect((await (await newGuest()).join({ ...wrong, code: 'k7q2' })).kind).toBe('joined');
  });

  async function nearSpaceLimit() {
    const limit = EVENT_CODE_RATE_LIMITS.space;
    await env.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), firestorePaths.rateLimit(`space_${ids.space}`)), {
        failures: limit.maxFailures - 1,
        windowStartedAt: Timestamp.now(),
        lockedUntil: null,
      });
    });
  }

  async function spaceLockEntries() {
    let actions: unknown[] = [];
    await env.withSecurityRulesDisabled(async (context) => {
      const snap = await getDocs(collection(context.firestore(), 'auditLog'));
      // 'entry1' is the fixture entry from seedBasics; only new entries count.
      actions = snap.docs
        .filter((d) => d.id !== 'entry1' && d.data().spaceId === ids.space)
        .map((d) => d.data().action);
    });
    return actions.filter((a) => a === 'spaceCodeEntryLocked').length;
  }

  it('after 300 wrong codes, locks typed codes for the space and writes the audit log', async () => {
    const limit = EVENT_CODE_RATE_LIMITS.space;
    await nearSpaceLimit();
    const result = await (await newGuest()).join({ publicId: ids.publicId, code: 'aaaa' });
    expect(result).toEqual({ kind: 'tooManyTries', retryAfterMs: limit.lockMs });
    expect(await spaceLockEntries()).toBe(1);

    // A different phone typing the right code on the plain code screen is blocked too.
    expect((await (await newGuest()).join({ publicId: ids.publicId, code: 'k7q2' })).kind).toBe('tooManyTries');
  });

  it('QR links (slug + code) keep working while the space is locked', async () => {
    await nearSpaceLimit();
    await (await newGuest()).join({ publicId: ids.publicId, code: 'aaaa' });

    const qrGuest = await newGuest();
    expect(await qrGuest.join({ publicId: ids.publicId, eventSlug: 'tunang', code: 'K7Q2' })).toMatchObject({
      kind: 'joined',
    });
    // A wrong QR code is still just a wrong code (device and IP limits apply).
    expect(await qrGuest.join({ publicId: ids.publicId, eventSlug: 'tunang', code: 'aaaa' })).toEqual({
      kind: 'wrongCode',
    });
    expect(await spaceLockEntries()).toBe(1);
  });

  it('wrong QR codes still count toward the space limit and trip the audit entry', async () => {
    await nearSpaceLimit();
    const qrGuest = await newGuest();
    // Not blocked itself, but this 300th wrong code locks typed entry and is logged.
    expect(await qrGuest.join({ publicId: ids.publicId, eventSlug: 'tunang', code: 'aaaa' })).toEqual({
      kind: 'wrongCode',
    });
    expect(await spaceLockEntries()).toBe(1);
    expect((await (await newGuest()).join({ publicId: ids.publicId, code: 'k7q2' })).kind).toBe('tooManyTries');
  });

  it('also joins linked events and keeps joinedAt when joining again', async () => {
    await env.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), firestorePaths.eventAccess(ids.event)), {
        code: 'k7q2',
        linkedEventIds: ['event3', ids.otherEvent],
      });
    });
    const guest = await newGuest();
    await guest.join({ publicId: ids.publicId, eventSlug: 'tunang', code: 'k7q2' });
    expect(await readAsAdmin(firestorePaths.eventMember('event3', guest.uid))).toMatchObject({ via: 'linkedEvent' });
    // A linked event in another space is ignored.
    expect(await readAsAdmin(firestorePaths.eventMember(ids.otherEvent, guest.uid))).toBeUndefined();

    const first = await readAsAdmin(firestorePaths.eventMember(ids.event, guest.uid));
    await guest.join({ publicId: ids.publicId, eventSlug: 'tunang', code: 'k7q2' });
    expect(await readAsAdmin(firestorePaths.eventMember(ids.event, guest.uid))).toEqual(first);
  });
});

describe('resolveCurrentEvent', () => {
  it('asks for a code until the device has joined, revealing nothing', async () => {
    const guest = await newGuest();
    expect(await guest.resolve({ publicId: ids.publicId })).toEqual({ kind: 'codeRequired' });
    expect(await guest.resolve({ publicId: 'zzzzzzz' })).toEqual({ kind: 'codeRequired' });
    expect(await guest.resolve({ publicId: ids.publicId, eventSlug: 'tunang' })).toEqual({ kind: 'codeRequired' });
  });

  it('opens the joined event, and only joined events by slug', async () => {
    const guest = await newGuest();
    await guest.join({ publicId: ids.publicId, eventSlug: 'tunang', code: 'k7q2' });
    expect(await guest.resolve({ publicId: ids.publicId })).toMatchObject({
      kind: 'event',
      event: { eventSlug: 'tunang' },
    });
    expect(await guest.resolve({ publicId: ids.publicId, eventSlug: 'tunang' })).toMatchObject({ kind: 'event' });
    expect(await guest.resolve({ publicId: ids.publicId, eventSlug: 'nikah' })).toEqual({ kind: 'codeRequired' });
  });

  it('picks the event happening today over an upcoming one', async () => {
    const guest = await newGuest();
    await guest.join({ publicId: ids.publicId, code: 'm4p8' });
    await guest.join({ publicId: ids.publicId, code: 'k7q2' });
    expect(await guest.resolve({ publicId: ids.publicId })).toMatchObject({ event: { eventSlug: 'tunang' } });
  });
});
