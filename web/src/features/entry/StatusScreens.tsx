import { useTranslation } from 'react-i18next';
import { Button, Screen } from '../../components/ui';

/** Calm loading screen; no spinner theatrics (design.md). */
export function LoadingScreen({ message }: { message?: string }) {
  const { t } = useTranslation();
  return (
    <Screen>
      <p role="status" className="text-ink-2">
        {message ?? t('common.loading')}
      </p>
    </Screen>
  );
}

/** No connection and nothing saved on the phone yet. */
export function OfflineScreen({ onRetry }: { onRetry: () => void }) {
  const { t } = useTranslation();
  return (
    <Screen
      bottom={
        <Button variant="primary" onClick={onRetry}>
          {t('common.retry')}
        </Button>
      }
    >
      <p role="alert">{t('common.offline')}</p>
    </Screen>
  );
}
