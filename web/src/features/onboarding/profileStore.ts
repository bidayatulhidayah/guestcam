import { readJson, writeJson } from '../../lib/device/localJson';
import { getBlob, putBlob } from '../../lib/device/blobStore';

/**
 * The guest's name and selfie, remembered per space on this device, so a
 * second event of the same couple never asks again (one guest per device per space).
 */
export interface SpaceProfile {
  displayName: string;
  /** True once the guest took a selfie or chose to skip it. */
  selfieDecided: boolean;
  hasSelfie: boolean;
}

const profileKey = (publicId: string) => `profile.${publicId}`;
const selfieKey = (publicId: string) => `selfie.${publicId}`;
const syncedKey = (eventId: string) => `guestSynced.${eventId}`;

export function readProfile(publicId: string): SpaceProfile | null {
  return readJson<SpaceProfile>(profileKey(publicId));
}

export function saveProfile(publicId: string, profile: SpaceProfile): void {
  writeJson(profileKey(publicId), profile);
}

export function saveSelfie(publicId: string, selfie: Blob): Promise<void> {
  return putBlob(selfieKey(publicId), selfie);
}

export function readSelfie(publicId: string): Promise<Blob | null> {
  return getBlob(selfieKey(publicId));
}
