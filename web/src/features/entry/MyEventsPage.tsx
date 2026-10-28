import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { Screen } from '../../components/ui';
import { listJoinedEvents } from './eventStore';

/** `/mine`: events this device has joined, always through permanent links. */
export function MyEventsPage() {
  const { t, i18n } = useTranslation();
  const events = listJoinedEvents();
  return (
    <Screen title={t('mine.title')}>
      {events.length === 0 ? (
        <p>{t('mine.empty')}</p>
      ) : (
        <ul className="flex flex-col border-t border-line">
          {events.map((event) => (
            <li key={`${event.publicId}/${event.eventSlug}`} className="border-b border-line">
              <Link
                to={`/s/${event.publicId}/${event.eventSlug}`}
                className="flex min-h-16 flex-col justify-center py-3 active:bg-paper-2"
              >
                <span className="font-display text-title text-accent">{event.displayNames}</span>
                <span className="text-ink-2">{i18n.language === 'en' ? event.title.en : event.title.ms}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Screen>
  );
}
