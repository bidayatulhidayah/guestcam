import { useTranslation } from 'react-i18next';
import { InfoRow, PlaceholderPage } from '../../components/PlaceholderPage';
import { useSpaceLocation } from './SpaceLayout';

/** `/s/:publicId` and `/:aliasName`: will call `resolveCurrentEvent` (Phase 1). */
export function CurrentEventPage() {
  const { t } = useTranslation();
  const location = useSpaceLocation();
  return (
    <PlaceholderPage pageKey="currentEvent">
      {location.kind === 'permanent' ? (
        <InfoRow label={t('placeholder.permanentLink')} value={location.publicId} />
      ) : (
        <InfoRow label={t('placeholder.alias')} value={location.aliasName} />
      )}
    </PlaceholderPage>
  );
}
