import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { PlaceholderPage } from '../components/PlaceholderPage';

export function NotFoundPage() {
  const { t } = useTranslation();
  return (
    <PlaceholderPage pageKey="notFound">
      <Link
        to="/"
        className="flex min-h-16 items-center justify-center rounded-card border border-ink text-button font-bold"
      >
        {t('pages.notFound.back')}
      </Link>
    </PlaceholderPage>
  );
}
