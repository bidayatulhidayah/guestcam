import { parseEntry } from '@guestcam/shared';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router';
import { InfoRow, PlaceholderPage } from '../../components/PlaceholderPage';
import { CodeScreenPage } from './CodeScreenPage';

/**
 * `.../:eventEntry`. Phase 1: with a code, call `joinEvent` and then
 * `history.replaceState` to `.../:eventSlug`; without one, show the menu for
 * members or the generic code screen for everyone else.
 */
export function EventEntryPage() {
  const { t } = useTranslation();
  const { eventEntry = '' } = useParams();
  const entry = parseEntry(eventEntry);

  if (entry.kind !== 'withCode') return <CodeScreenPage />;

  return (
    <PlaceholderPage pageKey="eventJoin">
      <InfoRow label={t('placeholder.eventSlug')} value={entry.eventSlug} />
      <InfoRow label={t('placeholder.code')} value={entry.code} />
    </PlaceholderPage>
  );
}
