import { EVENT_CODE_PATTERN, isReservedName } from './alphabet';

/** Event slug: lowercase letters and digits, single hyphens between words. */
export const EVENT_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const EVENT_SLUG_MIN_LENGTH = 2;
export const EVENT_SLUG_MAX_LENGTH = 40;

export type ParsedEntry =
  /** `tunang-k7q2`: slug plus a code to check with `joinEvent`. */
  | { kind: 'withCode'; eventSlug: string; code: string }
  /** `tunang`: slug only (member opens the menu, others see the code screen). */
  | { kind: 'slugOnly'; eventSlug: string }
  | { kind: 'invalid' };

export function isValidEventSlug(slug: string): boolean {
  return (
    slug.length >= EVENT_SLUG_MIN_LENGTH &&
    slug.length <= EVENT_SLUG_MAX_LENGTH &&
    EVENT_SLUG_PATTERN.test(slug) &&
    !isReservedName(slug)
  );
}

export function isValidEventCode(code: string): boolean {
  return EVENT_CODE_PATTERN.test(code);
}

/**
 * Parses the `/:eventEntry` route segment.
 *
 * Splits on the LAST hyphen, because slugs may contain hyphens
 * (`zaim-hidayah-k7q2` -> slug `zaim-hidayah`, code `k7q2`).
 * Everything is lowercased, so a code printed as `K7Q2` still works.
 * A suffix that is not a valid code is treated as part of the slug; a valid
 * code after an invalid or reserved slug makes the whole entry invalid.
 */
export function parseEntry(rawEntry: string): ParsedEntry {
  let entry: string;
  try {
    entry = decodeURIComponent(rawEntry).trim().toLowerCase();
  } catch {
    return { kind: 'invalid' };
  }

  const lastHyphen = entry.lastIndexOf('-');
  if (lastHyphen > 0) {
    const eventSlug = entry.slice(0, lastHyphen);
    const code = entry.slice(lastHyphen + 1);
    if (isValidEventCode(code)) {
      return isValidEventSlug(eventSlug) ? { kind: 'withCode', eventSlug, code } : { kind: 'invalid' };
    }
  }

  if (isValidEventSlug(entry)) {
    return { kind: 'slugOnly', eventSlug: entry };
  }
  return { kind: 'invalid' };
}
