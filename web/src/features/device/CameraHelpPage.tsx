import { useTranslation } from 'react-i18next';
import { Button, Icon, Screen } from '../../components/ui';
import { platformOf } from '../../lib/device/inAppBrowser';

function stepsKey(userAgent: string): 'ios' | 'samsung' | 'chrome' {
  if (platformOf(userAgent) === 'ios') return 'ios';
  return /SamsungBrowser/i.test(userAgent) ? 'samsung' : 'chrome';
}

/**
 * Camera did not open (pitfall C6): how to allow it in this browser, then try
 * again, or carry on without the camera. Reused for the microphone in Phase 2.
 */
export function CameraHelpPage({ onRetry, onContinue }: { onRetry: () => void; onContinue: () => void }) {
  const { t } = useTranslation();
  return (
    <Screen
      title={t('device.cameraHelpTitle')}
      bottom={
        <>
          <Button variant="primary" icon={<Icon name="camera" />} onClick={onRetry}>
            {t('common.retry')}
          </Button>
          <Button onClick={onContinue}>{t('device.continueWithoutCamera')}</Button>
        </>
      }
    >
      <p>{t('device.cameraHelpBody')}</p>
      <p className="rounded-card bg-paper-2 p-4">{t(`device.cameraSteps.${stepsKey(navigator.userAgent)}`)}</p>
    </Screen>
  );
}
