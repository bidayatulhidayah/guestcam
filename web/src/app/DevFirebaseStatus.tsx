import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

type Status = { state: 'connecting' } | { state: 'connected'; uid: string } | { state: 'error' };

/** Dev server only: proves the app reaches the emulators with Anonymous Auth. */
export function DevFirebaseStatus() {
  const { t } = useTranslation();
  const [status, setStatus] = useState<Status>({ state: 'connecting' });

  useEffect(() => {
    let active = true;
    import('../lib/firebase')
      .then(({ connectFirebase }) => connectFirebase())
      .then(({ uid }) => active && setStatus({ state: 'connected', uid }))
      .catch((error: unknown) => {
        console.error('Firebase emulator connection failed', error);
        if (active) setStatus({ state: 'error' });
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <p role="status" className="rounded-card bg-paper-2 p-4 text-caption break-all">
      {status.state === 'connecting' && t('placeholder.firebaseConnecting')}
      {status.state === 'connected' && t('placeholder.firebaseConnected', { uid: status.uid })}
      {status.state === 'error' && t('placeholder.firebaseError')}
    </p>
  );
}
