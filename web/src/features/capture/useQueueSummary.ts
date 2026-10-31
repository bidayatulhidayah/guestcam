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
  /** The phone refused storage: captures live only in this page until sent (pitfall C6). */
  memoryOnly: boolean;
}

export const EMPTY_SUMMARY: QueueSummary = {
  waiting: 0,
  uploading: null,
  held: 0,
  needsRepick: 0,
  failed: 0,
  sent: 0,
  memoryOnly: false,
};

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

/** This event's items in the queue on this phone, kept up to date; null until loaded. */
export function useQueueItems(eventId: string): { items: QueueItem[] | null; memoryOnly: boolean } {
  const [state, setState] = useState<{ items: QueueItem[] | null; memoryOnly: boolean }>({
    items: null,
    memoryOnly: false,
  });
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    let active = true;
    Promise.all([import('../../lib/queue'), import('dexie')])
      .then(async ([{ getQueueDb, getQueue, isMemoryOnly }, { liveQuery }]) => {
        // Starting the queue here resumes anything left from before a reload.
        void getQueue();
        const db = await getQueueDb();
        if (!active) return;
        const read = () => db.items.where('eventId').equals(eventId).toArray();
        if (isMemoryOnly()) {
          // Dexie's liveQuery does not observe the in-memory fallback database: re-read it every second.
          const tick = () => void read().then((items) => active && setState({ items, memoryOnly: true }));
          tick();
          const timer = setInterval(tick, 1000);
          unsubscribe = () => clearInterval(timer);
          return;
        }
        const subscription = liveQuery(read).subscribe({
          next: (items) => setState({ items, memoryOnly: false }),
        });
        unsubscribe = () => subscription.unsubscribe();
      })
      .catch(() => undefined);
    return () => {
      active = false;
      unsubscribe?.();
    };
  }, [eventId]);
  return state;
}

/** Live counts of this event's queue on this phone. */
export function useQueueSummary(eventId: string): QueueSummary {
  const { items, memoryOnly } = useQueueItems(eventId);
  return { ...summarize(items ?? []), memoryOnly };
}
