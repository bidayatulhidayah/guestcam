import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Screen } from '../../components/ui';

type PlayerState = { status: 'loading' } | { status: 'ready'; url: string } | { status: 'failed' };

/**
 * My Uploads: the guest plays one of their own videos (D-091), from this
 * phone's copy or, once sent, from their original on the server. The
 * browser streams it; nothing is downloaded whole.
 */
export function VideoPlayer({
  eventId,
  mediaId,
  eyebrow,
  onClose,
}: {
  eventId: string;
  mediaId: string;
  eyebrow: string;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const [state, setState] = useState<PlayerState>({ status: 'loading' });

  useEffect(() => {
    let active = true;
    let objectUrl: string | undefined;
    import('./videoSource')
      .then((m) => m.videoSource(eventId, mediaId))
      .then((source) => {
        if (source.local) objectUrl = source.url;
        if (active) setState({ status: 'ready', url: source.url });
        else if (objectUrl) URL.revokeObjectURL(objectUrl);
      })
      .catch(() => {
        if (active) setState({ status: 'failed' });
      });
    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [eventId, mediaId]);

  return (
    <Screen eyebrow={eyebrow} title={t('uploads.video')} bottom={<Button onClick={onClose}>{t('common.back')}</Button>}>
      {state.status === 'loading' ? <p role="status">{t('common.loading')}</p> : null}
      {state.status === 'failed' ? (
        <p role="status" className="rounded-card bg-paper-2 p-4">
          {t('uploads.playFailed')}
        </p>
      ) : null}
      {state.status === 'ready' ? (
        <video
          src={state.url}
          controls
          playsInline
          autoPlay
          className="max-h-[70vh] w-full border border-line bg-ink"
          onError={() => setState({ status: 'failed' })}
        />
      ) : null}
    </Screen>
  );
}
