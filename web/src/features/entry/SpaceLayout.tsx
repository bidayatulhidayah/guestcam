import { isValidPublicId } from '@guestcam/shared';
import { lazy, Suspense, useState } from 'react';
import { Outlet, useParams } from 'react-router';
import { NotFoundPage } from '../../app/NotFoundPage';
import { detectInAppBrowser } from '../../lib/device/inAppBrowser';
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
 * removing the code from the address) starts until they choose to stay.
 */
export function SpaceLayout() {
  const { publicId = '' } = useParams();
  const [inApp] = useState(() => detectInAppBrowser(navigator.userAgent));
  const [stayed, setStayed] = useState(() => readJson<boolean>(IN_APP_CONTINUE_KEY) === true);
  if (!isValidPublicId(publicId.toLowerCase())) return <NotFoundPage />;
  if (inApp && !stayed) {
    return (
      <Suspense fallback={<LoadingScreen />}>
        <InAppBrowserScreen
          browser={inApp}
          onContinue={() => {
            writeJson(IN_APP_CONTINUE_KEY, true);
            setStayed(true);
          }}
        />
      </Suspense>
    );
  }
  return <Outlet />;
}
