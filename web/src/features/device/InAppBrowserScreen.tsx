import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Screen } from '../../components/ui';
import { copyText } from '../../lib/device/copyText';
import { chromeIntentUrl, type InAppBrowser } from '../../lib/device/inAppBrowser';

/**
 * Shown before anything else when a space link opens inside an in-app browser
 * (pitfall I1). Nothing has been joined yet and the address still carries the
 * event code, so the copied or Chrome link works in the real browser.
 * "Teruskan di sini" never blocks the guest.
 */
export function InAppBrowserScreen({ browser, onContinue }: { browser: InAppBrowser; onContinue: () => void }) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState<boolean | null>(null);
  const browserName = t(`device.browser.${browser.platform}`);

  return (
    <Screen
      title={t(`device.inAppTitle.${browser.platform}`)}
      bottom={
        <>
          {browser.platform === 'android' ? (
            <Button variant="primary" onClick={() => window.location.assign(chromeIntentUrl(window.location))}>
              {t('device.openInChrome')}
            </Button>
          ) : null}
          <Button
            variant={browser.platform === 'android' ? 'secondary' : 'primary'}
            onClick={() => void copyText(window.location.href).then(setCopied)}
          >
            {t('device.copyLink')}
          </Button>
          <Button onClick={onContinue}>{t('device.continueHere')}</Button>
        </>
      }
    >
      <p>{t('device.inAppBody', { app: t(`device.apps.${browser.app}`), browser: browserName })}</p>
      {browser.platform !== 'android' ? <p>{t(`device.inAppSteps.${browser.platform}`)}</p> : null}
      {copied !== null ? (
        <p role="status" className="rounded-card bg-paper-2 p-4">
          {copied ? t('device.copied', { browser: browserName }) : t('device.copyFailed')}
        </p>
      ) : null}
    </Screen>
  );
}
