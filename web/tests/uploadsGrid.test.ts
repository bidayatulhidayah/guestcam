import { describe, expect, it } from 'vitest';
import { formatDay, formatDuration, groupByDay, markFor, viewerControls } from '../src/features/uploads/grid';
import type { UploadRow } from '../src/features/uploads/mergeItems';

function row(mediaId: string, sortAtMs: number, overrides: Partial<UploadRow> = {}): UploadRow {
  return {
    mediaId,
    type: 'image',
    status: 'sent',
    percent: null,
    visibility: 'private',
    showName: false,
    createdAtMs: sortAtMs,
    sortAtMs,
    durationMs: null,
    local: true,
    hasDoc: true,
    ...overrides,
  };
}

describe('My Uploads tile marks (D-093)', () => {
  it('marks only what needs attention; sent items carry none', () => {
    expect(markFor('uploading')).toBe('sending');
    expect(markFor('waiting')).toBe('waiting');
    expect(markFor('held')).toBe('waiting');
    expect(markFor('failed')).toBe('failed');
    expect(markFor('needsRepick')).toBe('failed');
    expect(markFor('rejected')).toBe('failed');
    expect(markFor('notArrived')).toBe('failed');
    expect(markFor('sent')).toBeNull();
  });
});

describe('My Uploads day groups (D-093)', () => {
  // Built from local date parts, so the test passes in any time zone.
  const now = new Date(2026, 10, 14, 21, 0).getTime();

  it('groups by the day each item was taken: today, yesterday, then dates, newest first', () => {
    const rows = [
      row('tonight', new Date(2026, 10, 14, 20, 30).getTime()),
      row('morning', new Date(2026, 10, 14, 0, 5).getTime()),
      row('lastNight', new Date(2026, 10, 13, 23, 59).getTime()),
      row('earlier', new Date(2026, 10, 2, 12, 0).getTime()),
    ];
    const groups = groupByDay(rows, now);
    expect(groups.map((g) => [g.label.kind, g.rows.map((r) => r.mediaId)])).toEqual([
      ['today', ['tonight', 'morning']],
      ['yesterday', ['lastNight']],
      ['date', ['earlier']],
    ]);
  });

  it('yesterday works across a month end', () => {
    const firstOfMonth = new Date(2026, 11, 1, 9, 0).getTime();
    const groups = groupByDay([row('a', new Date(2026, 10, 30, 22, 0).getTime())], firstOfMonth);
    expect(groups[0]?.label.kind).toBe('yesterday');
  });

  it('older days read like "2 Nov 2026"', () => {
    const day = new Date(2026, 10, 2, 12, 0).getTime();
    expect(formatDay(day, 'en')).toBe('2 Nov 2026');
    expect(formatDay(day, 'ms')).toMatch(/^2 Nov 2026$/);
  });

  it('video lengths read m:ss, or h:mm:ss from an hour', () => {
    expect(formatDuration(12_400)).toBe('0:12');
    expect(formatDuration(65_000)).toBe('1:05');
    expect(formatDuration(3_725_000)).toBe('1:02:05');
  });
});

describe('My Uploads item view controls (D-093)', () => {
  it('"Tunjuk nama saya" only when Awam', () => {
    expect(viewerControls({ status: 'sent', visibility: 'public' }).showName).toBe(true);
    expect(viewerControls({ status: 'sent', visibility: 'private' }).showName).toBe(false);
  });

  it('"Cuba lagi" only for an upload that failed, "Hantar sekarang" only while waiting for wifi', () => {
    expect(viewerControls({ status: 'failed', visibility: 'private' })).toMatchObject({ retry: true, sendNow: false });
    expect(viewerControls({ status: 'held', visibility: 'private' })).toMatchObject({ retry: false, sendNow: true });
    for (const status of ['sent', 'uploading', 'waiting', 'rejected', 'notArrived', 'needsRepick'] as const) {
      expect(viewerControls({ status, visibility: 'private' })).toMatchObject({ retry: false, sendNow: false });
    }
  });
});
