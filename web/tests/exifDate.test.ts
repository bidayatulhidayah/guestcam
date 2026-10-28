import { describe, expect, it } from 'vitest';
import { exifDateToMs } from '../src/lib/media/exifDate';

describe('exifDateToMs (pitfall M8)', () => {
  it('uses OffsetTimeOriginal when present', () => {
    expect(exifDateToMs('2026:10:28 14:03:22', '+08:00')).toBe(Date.UTC(2026, 9, 28, 6, 3, 22));
    expect(exifDateToMs('2026:10:28 14:03:22', '-05:00')).toBe(Date.UTC(2026, 9, 28, 19, 3, 22));
  });

  it('assumes Malaysia time when there is no offset', () => {
    expect(exifDateToMs('2026:10:28 14:03:22', undefined)).toBe(Date.UTC(2026, 9, 28, 6, 3, 22));
  });

  it('returns null for missing or broken dates', () => {
    for (const bad of [undefined, null, '', '0000:00:00 00:00:00', 'yesterday', 12345]) {
      expect(exifDateToMs(bad, null)).toBeNull();
    }
  });
});
