import { useTranslation } from 'react-i18next';
import { Screen } from '../components/ui';

/** Site root for guests who arrive without a QR link. Marketing page later. */
export function HomePage() {
  const { t } = useTranslation();
  return (
    <Screen title={t('home.title')}>
      <p>{t('home.body')}</p>
    </Screen>
  );
}
