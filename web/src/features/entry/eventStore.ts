import type { EventView } from '@guestcam/shared';
import { readJson, removeJson, writeJson } from '../../lib/device/localJson';

/**
 * What this device remembers about events it has joined, so a reopen shows the
 * menu at once and works offline (stale-while-revalidate, pitfall A2).
 */
const viewKey = (publicId: string, eventSlug: string) => `event.${publicId}.${eventSlug}`;
const currentKey = (publicId: string) => `current.${publicId}`;
const JOINED_KEY = 'joined';

export interface JoinedEvent {
  publicId: string;
  eventSlug: string;
  title: EventView['title'];
  displayNames: string;
  lastOpenedMs: number;
}

export function readCachedEvent(publicId: string, eventSlug: string): EventView | null {
  return readJson<EventView>(viewKey(publicId, eventSlug));
}

export function forgetEvent(publicId: string, eventSlug: string): void {
  removeJson(viewKey(publicId, eventSlug));
  writeJson(
    JOINED_KEY,
    listJoinedEvents().filter((e) => !(e.publicId === publicId && e.eventSlug === eventSlug)),
  );
}

/** Saves the view, remembers it as the space's current event and lists it in "My events". */
export function rememberEvent(event: EventView): void {
  writeJson(viewKey(event.publicId, event.eventSlug), event);
  writeJson(currentKey(event.publicId), event.eventSlug);
  const others = listJoinedEvents().filter(
    (e) => !(e.publicId === event.publicId && e.eventSlug === event.eventSlug),
  );
  const entry: JoinedEvent = {
    publicId: event.publicId,
    eventSlug: event.eventSlug,
    title: event.title,
    displayNames: event.displayNames,
    lastOpenedMs: Date.now(),
  };
  writeJson(JOINED_KEY, [entry, ...others]);
}

export function readCurrentSlug(publicId: string): string | null {
  return readJson<string>(currentKey(publicId));
}

export function listJoinedEvents(): JoinedEvent[] {
  return readJson<JoinedEvent[]>(JOINED_KEY) ?? [];
}

/** Last known gallery lock state from the server (`Guest.galleryUnlocked`). */
const unlockedKey = (eventId: string) => `unlocked.${eventId}`;

export function readGalleryUnlocked(eventId: string): boolean {
  return readJson<boolean>(unlockedKey(eventId)) === true;
}

export function saveGalleryUnlocked(eventId: string, unlocked: boolean): void {
  writeJson(unlockedKey(eventId), unlocked);
}
