/**
 * Callable function contracts shared by the web app and functions.
 * Guests never read `spaces/*` (it holds the plan, space number and
 * entitlements); everything the guest app needs comes in an `EventView`.
 */
import type { FeatureKey } from './features';
import type { GalleryMode, Localized, Theme } from './types';

export const CALLABLES = {
  resolveCurrentEvent: 'resolveCurrentEvent',
  joinEvent: 'joinEvent',
} as const;

/** What a member's phone may know about an event. No dates, venue, plan or space number. */
export interface EventView {
  spaceId: string;
  publicId: string;
  eventId: string;
  eventSlug: string;
  title: Localized;
  /** Couple names, e.g. "Zaim & Hidayah". */
  displayNames: string;
  /** Space default theme with the event's overrides applied. */
  theme: Theme;
  /** Effective features: entitled AND enabled (`isFeatureAvailable`). */
  features: FeatureKey[];
  galleryMode: GalleryMode;
  /** Uploads accepted until this time (epoch ms). */
  uploadUntilMs: number;
}

export interface ResolveCurrentEventRequest {
  publicId: string;
  /** Ask for this event specifically (`/s/:publicId/:eventSlug`). */
  eventSlug?: string | null;
}

/** `codeRequired` is identical for unknown events, non-joined events and unknown spaces. */
export type ResolveCurrentEventResponse = { kind: 'event'; event: EventView } | { kind: 'codeRequired' };

export interface JoinEventRequest {
  publicId: string;
  /** From the QR entry (`tunang-k7q2`). Without it the code is matched across the space's events. */
  eventSlug?: string | null;
  code: string;
}

export type JoinEventResponse =
  | { kind: 'joined'; event: EventView }
  /** Same answer for a wrong code, an unknown event and an unknown space. */
  | { kind: 'wrongCode' }
  | { kind: 'tooManyTries'; retryAfterMs: number };
