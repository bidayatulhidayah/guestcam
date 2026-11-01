import { isValidPublicId } from '@guestcam/shared';
import { lazy, Suspense, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Outlet, useParams } from 'react-router';
import { NotFoundPage } from '../../app/NotFoundPage';
import { TopBarStart } from '../../components/TopBar';
import { chromeIntentUrl, detectInAppBrowser } from '../../lib/device/inAppBrowser';
import { readJson, writeJson } from '../../lib/device/localJson';
import { LoadingScreen } from './StatusScreens';

const InAppBrowserScreen = lazy(() =>
  import('../device/InAppBrowserScreen').then((m) => ({ default: m.InAppBrowserScreen })),
);

/** Remembered per browser: a guest who chose to stay in the in-app browser is not asked again. */
const IN_APP_CONTINUE_KEY = 'inAppContinue';

/**
 * `/s/:publicId/*`: a malformed id never reaches the server. Inside an in-app
 * browser the guest is first offered Safari/Chrome; nothing below (joining,
 * removing the code from the address) starts until they choose to stay. After
 * that, a very small link in the top row offers the real browser again.
 */
export function SpaceLayout() {
  const { t } = useTranslation();
  const { publicId = '' } = useParams();
  const [inApp] = useState(() => detectInAppBrowser(navigator.userAgent));
  const [stayed, setStayed] = useState(() => readJson<boolean>(IN_APP_CONTINUE_KEY) === true);
  const [showNotice, setShowNotice] = useState(false);
  // The address as opened, before joining removes the code from it: the real
  // browser needs the code to join. Kept in memory only.
  const [entryHref] = useState(() => window.location.href);
  if (!isValidPublicId(publicId.toLowerCase())) return <NotFoundPage />;

  function browserLink(): URL {
    const entry = new URL(entryHref);
    return entry.pathname.startsWith(`/s/${publicId}`) ? entry : new URL(window.location.href);
  }

  if (inApp && !stayed) {
    return (
      <Suspense fallback={<LoadingScreen />}>
        <InAppBrowserScreen
          browser={inApp}
          href={window.location.href}
          onContinue={() => {
            writeJson(IN_APP_CONTINUE_KEY, true);
            setStayed(true);
          }}
        />
      </Suspense>
    );
  }

  return (
    <>
      {inApp ? (
        <TopBarStart>
          <button
            type="button"
            className="min-h-11 text-caption text-ink-2 underline underline-offset-2 active:text-ink"
            onClick={() =>
              inApp.platform === 'android'
                ? window.location.assign(chromeIntentUrl(browserLink()))
                : setShowNotice(true)
            }
          >
            {t(`device.inAppTitle.${inApp.platform}`)}
          </button>
        </TopBarStart>
      ) : null}
      {showNotice && inApp ? (
        <Suspense fallback={<LoadingScreen />}>
          <InAppBrowserScreen
            browser={inApp}
            href={browserLink().href}
            onContinue={() => setShowNotice(false)}
            onBack={() => setShowNotice(false)}
          />
        </Suspense>
      ) : null}
      {/* Kept mounted under the notice, so a capture or question in progress is not lost. */}
      <div hidden={showNotice} className="flex flex-1 flex-col">
        <Outlet />
      </div>
    </>
  );
}
