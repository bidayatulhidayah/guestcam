/**
 * Seeds a REAL Firebase project with the phone-test space (Phase 1), and
 * nothing else:
 *   #00100 · internal (test number reserved by Hidayah, D-066), "Pasangan Ujian",
 *   one engagement event "tunang", entitled to and enabled for every feature.
 *
 * Safety (live project):
 * - Creates exactly four documents: the space, its publicIds entry, the event
 *   and the event's private/access. Every write is a create, never a set, so
 *   the transaction fails rather than overwrite anything.
 * - If space #00100 already exists, it stops and changes nothing.
 * - Never touches #00000, #10000 and above, counters or the catalog.
 *
 * The permanent id and the event code are random and printed ONLY to this
 * terminal. Never paste them into docs, commits or chats (AGENTS.md).
 * Needs Google Application Default Credentials (docs/setup/new-computer.md).
 *
 *   npm run seed:project -- --project guestcam-2026
 */
import { randomBytes } from 'node:crypto';
import {
  EVENT_DEFAULTS,
  allFeatures,
  collections,
  firestorePaths,
  generateEventCode,
  generatePublicId,
  type Event,
  type EventAccess,
  type Space,
} from '@guestcam/shared';
import { applicationDefault, initializeApp } from 'firebase-admin/app';
import { Timestamp, getFirestore } from 'firebase-admin/firestore';

/** Internal test range 00002-09999, assigned by hand (Hidayah reserved 00100 for testing). */
const SPACE_NUMBER = '00100';

// Guard: only an internal test number, never the founder's #00000 or client numbers.
const numeric = Number(SPACE_NUMBER);
if (!/^\d{5}$/.test(SPACE_NUMBER) || numeric < 2 || numeric > 9999) {
  throw new Error(`Refusing to seed #${SPACE_NUMBER}: only internal test numbers 00002-09999 are allowed`);
}
const EVENT_SLUG = 'tunang';

function arg(name: string): string | undefined {
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

const projectId = arg('project');
if (!projectId) throw new Error('Pass --project <firebase-project-id>');
if (projectId.startsWith('demo-')) throw new Error('Use npm run seed for the emulators');
for (const name of ['FIRESTORE_EMULATOR_HOST', 'FIREBASE_AUTH_EMULATOR_HOST']) {
  if (process.env[name]) throw new Error(`${name} is set: refusing to seed a real project through the emulator`);
}
const baseUrl = (arg('base-url') ?? `https://${projectId}.web.app`).replace(/\/+$/, '');

initializeApp({ credential: applicationDefault(), projectId });
const db = getFirestore();
const bytes = (n: number) => new Uint8Array(randomBytes(n));

function printLinks(publicId: string, code: string): void {
  console.log('');
  console.log(`  Space #${SPACE_NUMBER} (internal test) · event "${EVENT_SLUG}"`);
  console.log(`  Permanent link : ${baseUrl}/s/${publicId}`);
  console.log(`  QR link        : ${baseUrl}/s/${publicId}/${EVENT_SLUG}-${code.toUpperCase()}`);
  console.log(`  Event code     : ${code.toUpperCase()}`);
  console.log('');
  console.log('  Keep these out of docs, commits and chats.');
}

async function main(): Promise<void> {
  const existing = await db.collection(collections.spaces).where('spaceNumber', '==', SPACE_NUMBER).limit(1).get();
  const found = existing.docs[0];
  if (found) {
    // Read-only from here: report what is there and stop.
    const space = found.data() as Space;
    const events = await db
      .collection(collections.events)
      .where('spaceId', '==', found.id)
      .where('eventSlug', '==', EVENT_SLUG)
      .limit(1)
      .get();
    const eventId = events.docs[0]?.id;
    const access = eventId ? ((await db.doc(firestorePaths.eventAccess(eventId)).get()).data() as EventAccess) : null;
    console.log(`Space #${SPACE_NUMBER} already exists in ${projectId}. Stopped; nothing was written.`);
    if (access) printLinks(space.publicId, access.code);
    return;
  }

  const now = Date.now();
  const startMs = now + 14 * 86_400_000;
  const endMs = startMs + 6 * 3_600_000;
  const spaceRef = db.collection(collections.spaces).doc();
  const eventRef = db.collection(collections.events).doc();
  const code = generateEventCode([], bytes);

  const publicId = await db.runTransaction(async (tx) => {
    // A permanent id must be unique across all spaces.
    let publicId = generatePublicId(bytes);
    while ((await tx.get(db.doc(firestorePaths.publicId(publicId)))).exists) publicId = generatePublicId(bytes);

    const space: Space = {
      publicId,
      spaceNumber: SPACE_NUMBER,
      plan: 'internal',
      trialEndsAt: null,
      displayNames: 'Pasangan Ujian',
      defaultTheme: { accent: '#4B5320', displayFont: null, coverPath: null, monogramPath: null, themeVersion: 1 },
      package: null,
      addOns: [],
      entitlementOverrides: {},
      entitlements: allFeatures(),
      createdAt: Timestamp.fromMillis(now),
    };
    const event: Event = {
      spaceId: spaceRef.id,
      eventSlug: EVENT_SLUG,
      type: 'engagement',
      title: { ms: 'Majlis Pertunangan', en: 'Engagement' },
      startAt: Timestamp.fromMillis(startMs),
      endAt: Timestamp.fromMillis(endMs),
      timeZone: 'Asia/Kuala_Lumpur',
      uploadUntil: Timestamp.fromMillis(endMs + EVENT_DEFAULTS.uploadWindowDays * 86_400_000),
      theme: null,
      galleryMode: 'live',
      revealAt: null,
      status: 'active',
      enabledFeatures: allFeatures(),
      featureChangedAt: {},
      perGuestQuotaThreshold: null,
      perGuestQuota: null,
      maxFoldersPerGuest: EVENT_DEFAULTS.maxFoldersPerGuest,
    };
    const access: EventAccess = { code, linkedEventIds: [] };

    // create() fails if the document exists: nothing can be overwritten.
    tx.create(spaceRef, space);
    tx.create(db.doc(firestorePaths.publicId(publicId)), { spaceId: spaceRef.id });
    tx.create(eventRef, event);
    tx.create(db.doc(firestorePaths.eventAccess(eventRef.id)), access);
    return publicId;
  });
  console.log(`Created space #${SPACE_NUMBER} in ${projectId}.`);
  printLinks(publicId, code);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
