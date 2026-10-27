import { describe, expect, it } from 'vitest';
import { generateEventCode, generatePublicId, normalizeEventCode, randomFromAlphabet } from '../src/codes';
import { mergeTheme, pickCurrentEvent, type EventTiming } from '../src/currentEvent';
import { EVENT_CODE_RATE_LIMITS } from '../src/limits';
import { isValidPublicId } from '../src/location';
import { lockRemainingMs, recordFailure } from '../src/rateLimit';
import type { Theme } from '../src/types';

/** Test-only randomness; production uses crypto random bytes. */
const bytes = (n: number) => Uint8Array.from({ length: n }, () => Math.floor(Math.random() * 256));
const HOUR = 3_600_000;
const DAY = 24 * HOUR;

describe('codes', () => {
  it('generates valid public ids and event codes', () => {
    for (let i = 0; i < 200; i++) {
      expect(isValidPublicId(generatePublicId(bytes))).toBe(true);
      expect(normalizeEventCode(generateEventCode([], bytes))).not.toBeNull();
    }
  });

  it('never reuses a code already used in the space', () => {
    // Fake randomness: the first draw gives "aaaa" (taken), the second "bbbb".
    let call = 0;
    const fake = (n: number) => new Uint8Array(n).fill(call++ === 0 ? 0 : 1);
    expect(randomFromAlphabet(4, (n) => new Uint8Array(n))).toBe('aaaa');
    expect(generateEventCode(['AAAA'], fake)).toBe('bbbb');
  });

  it('normalizes typed codes', () => {
    expect(normalizeEventCode(' K7Q2 ')).toBe('k7q2');
    expect(normalizeEventCode('k7q1')).toBeNull();
    expect(normalizeEventCode('k7q')).toBeNull();
  });
});

describe('pickCurrentEvent', () => {
  const now = Date.UTC(2026, 11, 20, 10);
  const event = (eventId: string, startOffsetMs: number, lengthMs = 6 * HOUR, uploadDays = 30): EventTiming => ({
    eventId,
    startMs: now + startOffsetMs,
    endMs: now + startOffsetMs + lengthMs,
    uploadUntilMs: now + startOffsetMs + lengthMs + uploadDays * DAY,
  });

  it('prefers the event happening today', () => {
    expect(pickCurrentEvent([event('next', 3 * DAY), event('today', -2 * HOUR)], now)).toBe('today');
  });

  it('then the next upcoming within 7 days', () => {
    expect(pickCurrentEvent([event('later', 10 * DAY), event('soon', 3 * DAY)], now)).toBe('soon');
  });

  it('then the most recent still accepting uploads', () => {
    expect(pickCurrentEvent([event('old', -20 * DAY), event('recent', -5 * DAY), event('far', 30 * DAY)], now)).toBe(
      'recent',
    );
  });

  it('returns null when nothing qualifies', () => {
    expect(pickCurrentEvent([event('closed', -60 * DAY), event('far', 30 * DAY)], now)).toBeNull();
    expect(pickCurrentEvent([], now)).toBeNull();
  });
});

describe('mergeTheme', () => {
  const base: Theme = { accent: '#4B5320', displayFont: null, coverPath: null, monogramPath: null, themeVersion: 1 };
  it('applies event overrides only where set', () => {
    expect(mergeTheme(base, { accent: '#1F3A5F' })).toEqual({ ...base, accent: '#1F3A5F' });
    expect(mergeTheme(base, null)).toEqual(base);
  });
});

describe('rate limit', () => {
  const policy = EVENT_CODE_RATE_LIMITS.device;
  const now = 1_000_000;

  it('locks after the 5th wrong code for 5 minutes', () => {
    let state = null as ReturnType<typeof recordFailure>['state'] | null;
    for (let i = 1; i <= 4; i++) {
      const result = recordFailure(state, now + i, policy);
      expect(result.lockedNow).toBe(false);
      state = result.state;
    }
    const fifth = recordFailure(state, now + 5, policy);
    expect(fifth.lockedNow).toBe(true);
    expect(lockRemainingMs(fifth.state, now + 5)).toBe(5 * 60_000);
    expect(lockRemainingMs(fifth.state, now + 5 + 5 * 60_000)).toBe(0);
  });

  it('starts a fresh window after the old one passes or the lock expires', () => {
    const first = recordFailure(null, now, policy).state;
    const later = recordFailure(first, now + policy.windowMs, policy).state;
    expect(later.failures).toBe(1);

    const locked = { failures: 5, windowStartedAtMs: now, lockedUntilMs: now + policy.lockMs };
    expect(recordFailure(locked, now + policy.lockMs, policy).state).toMatchObject({ failures: 1, lockedUntilMs: null });
  });
});
