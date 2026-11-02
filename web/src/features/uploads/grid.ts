/**
 * My Uploads as a photo grid (D-093): which mark a tile carries, how items
 * group by day, and which controls the item view offers. Pure, so it is
 * tested without a browser.
 */
import type { UploadRow } from './mergeItems';

/** The one mark a tile may carry: only when something needs attention. Sent items carry none. */
export type TileMark = 'sending' | 'waiting' | 'failed' | null;

export function markFor(status: UploadRow['status']): TileMark {
  switch (status) {
    case 'uploading':
      return 'sending';
    case 'waiting':
    case 'held':
      return 'waiting';
    case 'failed':
    case 'needsRepick':
    case 'rejected':
    case 'notArrived':
      return 'failed';
    case 'sent':
      return null;
  }
}

export type DayLabel = { kind: 'today' } | { kind: 'yesterday' } | { kind: 'date'; ms: number };

export interface DayGroup {
  key: string;
  label: DayLabel;
  rows: UploadRow[];
}

/** Calendar day on this phone (its own time zone, like its photo gallery). */
function dayKey(ms: number): string {
  const day = new Date(ms);
  return `${day.getFullYear()}-${day.getMonth() + 1}-${day.getDate()}`;
}

/**
 * Rows (newest taken first, as `mergeItems` returns them) grouped by the day
 * they were taken: "Hari ini", "Semalam", then dates.
 */
export function groupByDay(rows: UploadRow[], nowMs = Date.now()): DayGroup[] {
  const today = dayKey(nowMs);
  const before = new Date(nowMs);
  before.setDate(before.getDate() - 1);
  const yesterday = dayKey(before.getTime());
  const groups: DayGroup[] = [];
  for (const row of rows) {
    const key = dayKey(row.sortAtMs);
    let group = groups.at(-1);
    if (group?.key !== key) {
      const label: DayLabel =
        key === today ? { kind: 'today' } : key === yesterday ? { kind: 'yesterday' } : { kind: 'date', ms: row.sortAtMs };
      group = { key, label, rows: [] };
      groups.push(group);
    }
    group.rows.push(row);
  }
  return groups;
}

/** "2 Nov 2026" in the guest's language. */
export function formatDay(ms: number, language: string): string {
  return new Intl.DateTimeFormat(language === 'en' ? 'en-GB' : 'ms-MY', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(ms);
}

/** Video length as m:ss (h:mm:ss from an hour). */
export function formatDuration(ms: number): string {
  const total = Math.max(0, Math.round(ms / 1000));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = String(total % 60).padStart(2, '0');
  return hours > 0 ? `${hours}:${String(minutes).padStart(2, '0')}:${seconds}` : `${minutes}:${seconds}`;
}

/** Item view controls besides Peribadi / Awam and Padam, which every item has. */
export interface ViewerControls {
  /** "Tunjuk nama saya": only for Awam items. */
  showName: boolean;
  /** "Cuba lagi": an upload from this phone that failed. */
  retry: boolean;
  /** "Hantar sekarang": waiting for wifi. */
  sendNow: boolean;
}

export function viewerControls(row: Pick<UploadRow, 'status' | 'visibility'>): ViewerControls {
  return {
    showName: row.visibility === 'public',
    retry: row.status === 'failed',
    sendNow: row.status === 'held',
  };
}
