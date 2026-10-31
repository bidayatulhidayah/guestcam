import type { EventView } from '@guestcam/shared';
import { useCallback, useEffect, useState } from 'react';
import { forgetEvent, isEventFresh, readCachedEvent } from './eventStore';

export type EventViewState =
  | { status: 'loading' }
  | { status: 'ready'; event: EventView }
  | { status: 'codeRequired' }
  | { status: 'offline' };

/**
 * The event for `/s/:publicId/:eventSlug`. Shows the saved copy at once (works
 * offline) and refreshes it from the server in the background (pitfall A2),
 * unless the server sent it moments ago (right after `joinEvent`).
 */
export function useEventView(publicId: string, eventSlug: string): { state: EventViewState; retry: () => void } {
  const [state, setState] = useState<EventViewState>(() => {
    const cached = readCachedEvent(publicId, eventSlug);
    return cached ? { status: 'ready', event: cached } : { status: 'loading' };
  });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (attempt === 0 && isEventFresh(publicId, eventSlug) && readCachedEvent(publicId, eventSlug)) return;
    let active = true;
    import('./eventApi')
      .then(({ resolveEvent }) => resolveEvent({ publicId, eventSlug }))
      .then((result) => {
        if (!active) return;
        if (result.kind === 'event') {
          setState({ status: 'ready', event: result.event });
        } else {
          // Not (or no longer) a member on this device, e.g. browser data was cleared.
          forgetEvent(publicId, eventSlug);
          setState({ status: 'codeRequired' });
        }
      })
      .catch(() => {
        if (active) setState((current) => (current.status === 'ready' ? current : { status: 'offline' }));
      });
    return () => {
      active = false;
    };
  }, [publicId, eventSlug, attempt]);

  const retry = useCallback(() => {
    setState((current) => (current.status === 'offline' ? { status: 'loading' } : current));
    setAttempt((n) => n + 1);
  }, []);

  return { state, retry };
}
