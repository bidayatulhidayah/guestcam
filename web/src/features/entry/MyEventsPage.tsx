import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { Screen } from '../../components/ui';
import { listJoinedEvents, readCachedEvent, type JoinedEvent } from './eventStore';

const keyOf = (event: JoinedEvent) => `${event.publicId}/${event.eventSlug}`;

/** How many items each event has sent from this phone (the queue is loaded only for this). */
function useSentCounts(events: JoinedEvent[]): Record<string, number> {
  const [counts, setCounts] = useState<Record<string, number>>({});
  useEffect(() => {
    let active = true;
    import('../../lib/queue')
      .then((m) => m.getQueueDb())
      .then((db) =>
        Promise.all(
          events.map(async (event) => {
            const eventId = readCachedEvent(event.publicId, event.eventSlug)?.eventId;
            const sent = eventId ? await db.items.where('[eventId+status]').equals([eventId, 'sent']).count() : 0;
            return [keyOf(event), sent] as const;
          }),
        ),
      )
      .then((entries) => active && setCounts(Object.fromEntries(entries)))
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [events]);
  return counts;
}

/** `/mine`: events this device has joined, always through permanent links, each with its My Uploads. */
export function MyEventsPage() {
  const { t, i18n } = useTranslation();
  const [events] = useState(listJoinedEvents);
  const counts = useSentCounts(events);
  return (
    <Screen title={t('mine.title')}>
      {events.length === 0 ? (
        <p>{t('mine.empty')}</p>
      ) : (
        <ul className="flex flex-col border-t border-line">
          {events.map((event) => {
            const base = `/s/${event.publicId}/${event.eventSlug}`;
            const sent = counts[keyOf(event)] ?? 0;
            return (
              <li key={keyOf(event)} className="flex flex-col border-b border-line">
                <Link to={base} className="flex min-h-16 flex-col justify-center py-3 active:bg-paper-2">
                  <span className="font-display text-title text-accent">{event.displayNames}</span>
                  <span className="text-ink-2">{i18n.language === 'en' ? event.title.en : event.title.ms}</span>
                </Link>
                <Link
                  to={`${base}/mine`}
                  className="flex min-h-12 items-center justify-between gap-3 pb-3 font-bold active:bg-paper-2"
                >
                  <span>{t('mine.uploads')}</span>
                  {sent > 0 ? (
                    <span className="text-caption font-normal text-ink-2">{t('mine.sentFromPhone', { count: sent })}</span>
                  ) : null}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </Screen>
  );
}
