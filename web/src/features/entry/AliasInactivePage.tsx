import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { Screen } from '../../components/ui';

/**
 * Neutral page for an alias outside its booked window: no couple information
 * (D-035). Aliases are built in Phase 4, so every alias shows this for now.
 */
export function AliasInactivePage() {
  const { t } = useTranslation();
  return (
    <Screen title={t('entry.aliasInactiveTitle')} back>
      <p>{t('entry.aliasInactiveBody')}</p>
      <Link
        to="/login"
        className="mt-auto flex min-h-16 items-center justify-center rounded-card border border-ink text-button font-bold"
      >
        {t('pages.login.title')}
      </Link>
    </Screen>
  );
}
