import { allFeatures, firestorePaths } from '@guestcam/shared';
import type { RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { doc, setDoc, Timestamp } from 'firebase/firestore';

/** Ids used across the rules tests. */
export const ids = {
  space: 'space1',
  otherSpace: 'space2',
  event: 'event1',
  otherEvent: 'event2',
  publicId: '7k3qmxa',
  owner: 'owner1',
  moderator: 'moderator1',
  guest: 'guest1',
  otherGuest: 'guest2',
  stranger: 'stranger1',
} as const;

/**
 * One space with an owner and a moderator, one event with two member guests,
 * and a second event in another space. Written with rules disabled.
 */
export async function seedBasics(env: RulesTestEnvironment): Promise<void> {
  await env.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();
    const now = Timestamp.now();
    const later = Timestamp.fromMillis(Date.now() + 30 * 86_400_000);
    const theme = { accent: '#4B5320', displayFont: null, coverPath: null, monogramPath: null, themeVersion: 1 };

    await setDoc(doc(db, firestorePaths.space(ids.space)), {
      publicId: ids.publicId,
      spaceNumber: '10001',
      plan: 'beta',
      trialEndsAt: null,
      displayNames: 'Ali & Siti',
      defaultTheme: theme,
      package: null,
      addOns: [],
      entitlementOverrides: {},
      entitlements: allFeatures(),
      createdAt: now,
    });
    await setDoc(doc(db, firestorePaths.spaceHost(ids.space, ids.owner)), {
      role: 'owner',
      addedAt: now,
      addedBy: 'seed',
    });
    await setDoc(doc(db, firestorePaths.spaceHost(ids.space, ids.moderator)), {
      role: 'moderator',
      addedAt: now,
      addedBy: 'seed',
    });
    await setDoc(doc(db, firestorePaths.publicId(ids.publicId)), { spaceId: ids.space });

    for (const [eventId, spaceId] of [
      [ids.event, ids.space],
      [ids.otherEvent, ids.otherSpace],
    ] as const) {
      await setDoc(doc(db, firestorePaths.event(eventId)), {
        spaceId,
        eventSlug: 'tunang',
        type: 'engagement',
        title: { ms: 'Majlis Pertunangan', en: 'Engagement' },
        startAt: now,
        endAt: now,
        timeZone: 'Asia/Kuala_Lumpur',
        uploadUntil: later,
        theme: null,
        galleryMode: 'live',
        revealAt: null,
        status: 'active',
        enabledFeatures: allFeatures(),
        featureChangedAt: {},
        perGuestQuotaThreshold: null,
        perGuestQuota: null,
        maxFoldersPerGuest: 5,
      });
      await setDoc(doc(db, firestorePaths.eventAccess(eventId)), { code: 'k7q2', linkedEventIds: [] });
    }

    for (const uid of [ids.guest, ids.otherGuest]) {
      await setDoc(doc(db, firestorePaths.eventMember(ids.event, uid)), { joinedAt: now, via: 'code' });
    }
    await setDoc(doc(db, firestorePaths.auditLogEntry('entry1')), {
      spaceId: ids.space,
      eventId: null,
      uid: 'system',
      action: 'spaceCodeEntryLocked',
      target: null,
      details: null,
      at: now,
    });
  });
}
