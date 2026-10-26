import { isValidEventSlug } from '@guestcam/shared';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router';
import { InfoRow, PlaceholderPage } from '../../components/PlaceholderPage';
import { CodeScreenPage } from '../entry/CodeScreenPage';

/** `.../:eventSlug/gallery`: lock and reveal rules apply (Phase 3). */
export function GalleryPage() {
  const { t } = useTranslation();
  const { eventSlug = '' } = useParams();
  if (!isValidEventSlug(eventSlug.toLowerCase())) return <CodeScreenPage />;

  return (
    <PlaceholderPage pageKey="gallery">
      <InfoRow label={t('placeholder.eventSlug')} value={eventSlug.toLowerCase()} />
    </PlaceholderPage>
  );
}
