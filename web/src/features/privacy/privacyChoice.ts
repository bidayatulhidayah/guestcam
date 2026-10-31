import type { Visibility } from '@guestcam/shared';
import { readJson, writeJson } from '../../lib/device/localJson';

/** The guest's answer to the privacy question, per event (spec: Privacy and gallery logic). */
export interface PrivacyChoice {
  visibility: Visibility;
  /** Only matters for public items: name and selfie shown in the gallery. */
  showName: boolean;
}

/** Used until the guest answers, and when they leave without answering. */
export const DEFAULT_CHOICE: PrivacyChoice = { visibility: 'private', showName: false };

const key = (eventId: string) => `privacy.${eventId}`;

/** Null until the guest has answered the full-screen question for this event. */
export function readPrivacyChoice(eventId: string): PrivacyChoice | null {
  return readJson<PrivacyChoice>(key(eventId));
}

export function savePrivacyChoice(eventId: string, choice: PrivacyChoice): void {
  writeJson(key(eventId), choice);
}
