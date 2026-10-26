import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { PlaceholderPage } from '../../components/PlaceholderPage';

/** Neutral page for an alias outside its booked window: no couple information (D-035). */
export function AliasInactivePage() {
  const { t } = useTranslation();
  return (
    <PlaceholderPage pageKey="aliasInactive">
      <p>{t('pages.aliasInactive.body')}</p>
      <Link
        to="/login"
        className="flex min-h-16 items-center justify-center rounded-card border border-ink text-button font-bold"
      >
        {t('pages.login.title')}
      </Link>
    </PlaceholderPage>
  );
}
