import { FEATURE_KEYS } from '@guestcam/shared';

/** Returns ok plus the feature catalog size, proving shared/ is bundled in. */
export function healthCheck(): { ok: true; featureCount: number } {
  return { ok: true, featureCount: FEATURE_KEYS.length };
}
