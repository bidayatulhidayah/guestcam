import {
  collections,
  firestorePaths,
  isValidPublicId,
  type Event,
  type EventAccess,
  type PublicIdIndex,
  type Space,
} from '@guestcam/shared';
import { db } from '../firebase';
import { isOpenEvent } from './eventView';

export interface LoadedSpace {
  spaceId: string;
  space: Space;
}

export interface LoadedEvent {
  eventId: string;
  event: Event;
}

/** Space for a permanent link id, or null (unknown and malformed look the same). */
export async function loadSpaceByPublicId(publicId: string): Promise<LoadedSpace | null> {
  const normalized = publicId.trim().toLowerCase();
  if (!isValidPublicId(normalized)) return null;
  const index = await db.doc(firestorePaths.publicId(normalized)).get();
  const spaceId = (index.data() as PublicIdIndex | undefined)?.spaceId;
  if (!spaceId) return null;
  const spaceSnap = await db.doc(firestorePaths.space(spaceId)).get();
  if (!spaceSnap.exists) return null;
  return { spaceId, space: spaceSnap.data() as Space };
}

/** Joinable events of a space, optionally only the one with this slug. */
export async function loadOpenEvents(spaceId: string, eventSlug?: string | null): Promise<LoadedEvent[]> {
  let query = db.collection(collections.events).where('spaceId', '==', spaceId);
  if (eventSlug) query = query.where('eventSlug', '==', eventSlug);
  const snapshot = await query.get();
  return snapshot.docs
    .map((docSnap) => ({ eventId: docSnap.id, event: docSnap.data() as Event }))
    .filter(({ event }) => isOpenEvent(event));
}

/** Event codes, read with the Admin SDK only (never sent to clients). */
export async function loadEventAccess(eventIds: string[]): Promise<Map<string, EventAccess>> {
  if (eventIds.length === 0) return new Map();
  const refs = eventIds.map((eventId) => db.doc(firestorePaths.eventAccess(eventId)));
  const snaps = await db.getAll(...refs);
  const result = new Map<string, EventAccess>();
  snaps.forEach((snap, i) => {
    const eventId = eventIds[i];
    if (eventId && snap.exists) result.set(eventId, snap.data() as EventAccess);
  });
  return result;
}

/** Which of these events the user has joined. */
export async function memberEventIds(eventIds: string[], uid: string): Promise<Set<string>> {
  if (eventIds.length === 0) return new Set();
  const refs = eventIds.map((eventId) => db.doc(firestorePaths.eventMember(eventId, uid)));
  const snaps = await db.getAll(...refs);
  return new Set(eventIds.filter((_, i) => snaps[i]?.exists));
}
