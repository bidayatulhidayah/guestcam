import type { EventView } from '@guestcam/shared';
import { createContext, useContext, useEffect, type ReactNode } from 'react';

const EventContext = createContext<EventView | null>(null);

/** Provides the joined event and applies its accent colour to the whole page. */
export function EventProvider({ event, children }: { event: EventView; children: ReactNode }) {
  const accent = event.theme.accent;
  useEffect(() => {
    // Only the accent is themed; press and tint colours derive from it (tokens.css).
    const root = document.documentElement;
    root.style.setProperty('--accent', accent);
    return () => {
      root.style.removeProperty('--accent');
    };
  }, [accent]);

  return <EventContext.Provider value={event}>{children}</EventContext.Provider>;
}

export function useEvent(): EventView {
  const event = useContext(EventContext);
  if (!event) throw new Error('useEvent must be used inside EventProvider');
  return event;
}
