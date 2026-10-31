import { useTranslation } from 'react-i18next';
import { Button, Screen } from '../../components/ui';

export function formatBytes(bytes: number): string {
  if (bytes >= 1024 ** 3) return `${(bytes / 1024 ** 3).toFixed(1)} GB`;
  return `${Math.max(1, Math.round(bytes / 1024 ** 2))} MB`;
}

/**
 * Asked once per selection that holds a file over 50 MB (D-063): one question
 * on its own screen. "Later" holds only the large files; small ones go now.
 */
export function LargeFilePrompt({
  largestBytes,
  onNow,
  onLater,
}: {
  largestBytes: number;
  onNow: () => void;
  onLater: () => void;
}) {
  const { t } = useTranslation();
  return (
    <Screen
      title={t('capture.largeTitle')}
      bottom={
        <>
          <Button variant="primary" onClick={onNow}>
            {t('capture.largeNow')}
          </Button>
          <Button onClick={onLater}>{t('capture.largeLater')}</Button>
        </>
      }
    >
      <p>{t('capture.largeBody', { size: formatBytes(largestBytes) })}</p>
    </Screen>
  );
}
