/** Malaysia (UTC+08:00): the assumed time zone when a photo has no offset (pitfall M8). */
export const DEFAULT_OFFSET_MINUTES = 8 * 60;

/**
 * Converts an EXIF date ("2026:10:28 14:03:22") and optional offset ("+08:00")
 * to epoch ms. EXIF dates have no time zone; without `OffsetTimeOriginal` the
 * event's zone is assumed. Returns null for missing or broken values.
 */
export function exifDateToMs(
  value: unknown,
  offset: unknown,
  fallbackOffsetMinutes = DEFAULT_OFFSET_MINUTES,
): number | null {
  if (typeof value !== 'string') return null;
  const match = /^(\d{4}):(\d{2}):(\d{2})[ T](\d{2}):(\d{2}):(\d{2})/.exec(value.trim());
  if (!match) return null;
  const [y, mo, d, h, mi, s] = match.slice(1).map(Number) as [number, number, number, number, number, number];
  if (y < 1990 || mo < 1 || mo > 12 || d < 1 || d > 31) return null;
  let offsetMinutes = fallbackOffsetMinutes;
  if (typeof offset === 'string') {
    const o = /^([+-])(\d{2}):?(\d{2})$/.exec(offset.trim());
    if (o) offsetMinutes = (o[1] === '-' ? -1 : 1) * (Number(o[2]) * 60 + Number(o[3]));
  }
  return Date.UTC(y, mo - 1, d, h, mi, s) - offsetMinutes * 60_000;
}
