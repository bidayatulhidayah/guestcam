import { useTranslation } from 'react-i18next';
import { PlaceholderPage } from '../../components/PlaceholderPage';

/**
 * Generic code screen. Identical for unknown events, non-joined events and
 * malformed entries, so it never reveals that an event exists (D-036).
 */
export function CodeScreenPage() {
  const { t } = useTranslation();
  return (
    <PlaceholderPage pageKey="codeScreen">
      <p>{t('pages.codeScreen.body')}</p>
    </PlaceholderPage>
  );
}
