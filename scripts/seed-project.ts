/**
 * Seeds a REAL Firebase project with the phone-test space (Phase 1):
 *   #00100 · internal (manually assigned test number, D-042), "Pasangan Ujian",
 *   one engagement event "tunang", entitled to and enabled for every feature.
 * plus counters/spaces (next client number 10001) and catalog/current when
 * missing. #10001 stays free for the friend's engagement.
 *
 * The permanent id and the event code are random and printed ONLY to this
 * terminal. Never paste them into docs, commits or chats (AGENTS.md).
 * Safe to run again: an existing #00100 is reported, not duplicated.
 *
 * Needs Google Application Default Credentials for an account with access
 * to the project (see docs/setup/new-computer.md).
 *
 *   npm run seed:project -- --project guestcam-2026
 */
import { randomBytes } from 'node:crypto';
import {
  EVENT_DEFAULTS,
  FEATURE_KEYS,
  PACKAGE_FEATURES,
  allFeatures,
  collections,
  firestorePaths,
  generateEventCode,
  generatePublicId,
  type Catalog,
  type Event,
  type EventAccess,
  type Space,
  type SpaceCounter,
} from '@guestcam/shared';
import { applicationDefault, initializeApp } from 'firebase-admin/app';
import { Timestamp, getFirestore } from 'firebase-admin/firestore';

/** Internal test range 00002-09999, assigned by hand (Hidayah reserved 00100 for testing). */
const SPACE_NUMBER = '00100';
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
    const space = found.data() as Space;
    const events = await db
      .collection(collections.events)
      .where('spaceId', '==', found.id)
      .where('eventSlug', '==', EVENT_SLUG)
      .limit(1)
      .get();
    const eventId = events.docs[0]?.id;
    const access = eventId ? ((await db.doc(firestorePaths.eventAccess(eventId)).get()).data() as EventAccess) : null;
    console.log(`Space #${SPACE_NUMBER} already exists in ${projectId}; nothing changed.`);
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
    const counterRef = db.doc(firestorePaths.spaceCounter());
    const counter = await tx.get(counterRef);
    const catalogRef = db.doc(firestorePaths.catalog());
    const catalog = await tx.get(catalogRef);

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

    tx.set(spaceRef, space);
    tx.set(db.doc(firestorePaths.publicId(publicId)), { spaceId: spaceRef.id });
    tx.set(eventRef, event);
    tx.set(db.doc(firestorePaths.eventAccess(eventRef.id)), access);
    // Client spaces start at 10001 (10000 is reserved); internal numbers never use the counter.
    if (!counter.exists) tx.set(counterRef, { nextClientNumber: 10001 } satisfies SpaceCounter);
    if (!catalog.exists) {
      const initial: Catalog = {
        features: [...FEATURE_KEYS],
        packages: {
          asas: { features: [...PACKAGE_FEATURES.asas], priceByGuestTier: {} },
          lengkap: { features: [...PACKAGE_FEATURES.lengkap], priceByGuestTier: {} },
          premium: { features: [...PACKAGE_FEATURES.premium], priceByGuestTier: {} },
        },
        addOns: {},
        currency: 'MYR',
        catalogVersion: 1,
      };
      tx.set(catalogRef, initial);
    }
    return publicId;
  });
  console.log(`Created space #${SPACE_NUMBER} in ${projectId}.`);
  printLinks(publicId, code);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
