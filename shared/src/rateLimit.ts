import type { RateLimitPolicy } from './limits';

/** Plain-number form of `RateLimit` (the server converts Timestamps). */
export interface RateLimitState {
  failures: number;
  windowStartedAtMs: number;
  lockedUntilMs: number | null;
}

/** Milliseconds until entry opens again; 0 when not locked. */
export function lockRemainingMs(state: RateLimitState | null | undefined, nowMs: number): number {
  if (!state?.lockedUntilMs) return 0;
  return Math.max(0, state.lockedUntilMs - nowMs);
}

/**
 * Records one wrong attempt. A new window starts when the old one has passed
 * or a lock has expired. Reaching `maxFailures` locks entry for `lockMs`;
 * `lockedNow` is true only on the attempt that caused the lock.
 */
export function recordFailure(
  state: RateLimitState | null | undefined,
  nowMs: number,
  policy: RateLimitPolicy,
): { state: RateLimitState; lockedNow: boolean } {
  const lockExpired = state?.lockedUntilMs != null && state.lockedUntilMs <= nowMs;
  const windowExpired = !state || nowMs - state.windowStartedAtMs >= policy.windowMs;
  const base: RateLimitState =
    !state || windowExpired || lockExpired
      ? { failures: 0, windowStartedAtMs: nowMs, lockedUntilMs: null }
      : { ...state };

  base.failures += 1;
  if (base.failures >= policy.maxFailures && base.lockedUntilMs === null) {
    base.lockedUntilMs = nowMs + policy.lockMs;
    return { state: base, lockedNow: true };
  }
  return { state: base, lockedNow: false };
}
