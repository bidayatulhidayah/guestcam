import { useEffect, useState } from 'react';
import type { QueueItem } from '../../lib/queue/types';

export interface QueueSummary {
  waiting: number;
  /** The item being sent now, with its progress. */
  uploading: { percent: number; resumed: boolean } | null;
  held: number;
  needsRepick: number;
  failed: number;
  sent: number;
}

export const EMPTY_SUMMARY: QueueSummary = { waiting: 0, uploading: null, held: 0, needsRepick: 0, failed: 0, sent: 0 };

export function summarize(items: QueueItem[]): QueueSummary {
  const summary: QueueSummary = { ...EMPTY_SUMMARY };
  for (const item of items) {
    switch (item.status) {
      case 'uploading':
        summary.uploading = {
          percent: item.sizeBytes > 0 ? Math.min(100, Math.round((item.bytesTransferred / item.sizeBytes) * 100)) : 0,
          resumed: item.resumed,
        };
        break;
      case 'waiting':
        summary.waiting++;
        break;
      case 'held':
        summary.held++;
        break;
      case 'needsRepick':
        summary.needsRepick++;
        break;
      case 'failed':
        summary.failed++;
        break;
      case 'sent':
        summary.sent++;
        break;
    }
  }
  return summary;
}

/** Live counts of this event's queue on this phone (Dexie liveQuery, loaded lazily). */
export function useQueueSummary(eventId: string): QueueSummary {
  const [summary, setSummary] = useState<QueueSummary>(EMPTY_SUMMARY);
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    let active = true;
    Promise.all([import('../../lib/queue'), import('dexie')])
      .then(([{ getQueueDb, getQueue }, { liveQuery }]) => {
        if (!active) return;
        // Starting the queue here resumes anything left from before a reload.
        void getQueue();
        const subscription = liveQuery(() => getQueueDb().items.where('eventId').equals(eventId).toArray()).subscribe({
          next: (items) => setSummary(summarize(items)),
        });
        unsubscribe = () => subscription.unsubscribe();
      })
      .catch(() => undefined);
    return () => {
      active = false;
      unsubscribe?.();
    };
  }, [eventId]);
  return summary;
}
