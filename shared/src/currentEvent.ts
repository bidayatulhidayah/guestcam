import { EVENT_DEFAULTS } from './limits';
import type { Theme } from './types';

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

export interface EventTiming {
  eventId: string;
  startMs: number;
  endMs: number;
  uploadUntilMs: number;
}

/**
 * The "current event" for a space (architecture.md Part 3, Routes):
 * happening today (start -12 h to end +12 h) -> next upcoming within 7 days ->
 * most recent still within its upload window -> none (couple-names landing).
 * Only events the caller may see are passed in.
 */
export function pickCurrentEvent(events: readonly EventTiming[], nowMs: number): string | null {
  const window = EVENT_DEFAULTS.currentEventWindowHours * HOUR;

  const today = events
    .filter((e) => nowMs >= e.startMs - window && nowMs <= e.endMs + window)
    .sort((a, b) => Math.abs(a.startMs - nowMs) - Math.abs(b.startMs - nowMs));
  if (today[0]) return today[0].eventId;

  const upcoming = events
    .filter((e) => e.startMs > nowMs && e.startMs - nowMs <= EVENT_DEFAULTS.upcomingEventDays * DAY)
    .sort((a, b) => a.startMs - b.startMs);
  if (upcoming[0]) return upcoming[0].eventId;

  const recent = events
    .filter((e) => e.endMs < nowMs && nowMs <= e.uploadUntilMs)
    .sort((a, b) => b.endMs - a.endMs);
  if (recent[0]) return recent[0].eventId;

  return null;
}

/** Event theme overrides on top of the space default (`Event.theme`). */
export function mergeTheme(spaceDefault: Theme, eventOverride: Partial<Theme> | null): Theme {
  if (!eventOverride) return spaceDefault;
  const merged: Theme = { ...spaceDefault };
  for (const [key, value] of Object.entries(eventOverride) as [keyof Theme, Theme[keyof Theme]][]) {
    if (value !== undefined) (merged as Record<keyof Theme, unknown>)[key] = value;
  }
  return merged;
}
