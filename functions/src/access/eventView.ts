import {
  FEATURE_KEYS,
  isFeatureAvailable,
  mergeTheme,
  type Event,
  type EventView,
  type Space,
} from '@guestcam/shared';

/** Builds the guest-safe view of an event: no dates, plan, space number or codes. */
export function buildEventView(spaceId: string, space: Space, eventId: string, event: Event): EventView {
  return {
    spaceId,
    publicId: space.publicId,
    eventId,
    eventSlug: event.eventSlug,
    title: event.title,
    displayNames: space.displayNames,
    theme: mergeTheme(space.defaultTheme, event.theme),
    features: FEATURE_KEYS.filter((key) => isFeatureAvailable(space.entitlements, event.enabledFeatures, key)),
    galleryMode: event.galleryMode,
    uploadUntilMs: event.uploadUntil.toMillis(),
  };
}

/** Events guests can join or reopen. Drafts and archived events stay hidden. */
export function isOpenEvent(event: Event): boolean {
  return event.status === 'active' || event.status === 'closed';
}
