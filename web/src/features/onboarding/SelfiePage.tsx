import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Icon, Screen } from '../../components/ui';
import { resizeSelfie } from './resizeSelfie';

/**
 * Optional selfie with the phone's own front camera (`capture="user"`).
 * "Langkau" is always visible. The selfie is never an upload and never in a gallery.
 */
export function SelfiePage({ onDone }: { onDone: (selfie: Blob | null) => void }) {
  const { t } = useTranslation();
  const input = useRef<HTMLInputElement>(null);
  const [selfie, setSelfie] = useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!selfie) return;
    const url = URL.createObjectURL(selfie);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [selfie]);

  // The camera opens from the tap itself (iOS needs a user gesture, pitfall C1).
  const openCamera = () => input.current?.click();

  async function picked(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    try {
      setSelfie(await resizeSelfie(file));
      setError(null);
    } catch {
      setError(t('selfie.failed'));
    }
  }

  return (
    <Screen
      title={t('selfie.title')}
      bottom={
        <>
          {selfie ? (
            <>
              <Button variant="primary" onClick={() => onDone(selfie)}>
                {t('selfie.use')}
              </Button>
              <Button onClick={openCamera}>{t('selfie.retake')}</Button>
            </>
          ) : (
            <Button variant="primary" icon={<Icon name="camera" />} onClick={openCamera}>
              {t('selfie.take')}
            </Button>
          )}
          <Button onClick={() => onDone(null)}>{t('selfie.skip')}</Button>
        </>
      }
    >
      <p>{t('selfie.body')}</p>
      <div className="flex flex-1 items-center justify-center">
        {previewUrl ? (
          <img
            src={previewUrl}
            alt={t('selfie.preview')}
            className="size-48 rounded-full border-4 border-paper-2 object-cover"
          />
        ) : (
          <div className="flex size-48 items-center justify-center rounded-full border border-line text-ink-2">
            <Icon name="user" size={64} />
          </div>
        )}
      </div>
      {error ? (
        <p role="alert" className="text-danger">
          {error}
        </p>
      ) : null}
      <input ref={input} type="file" accept="image/*" capture="user" hidden onChange={picked} />
    </Screen>
  );
}
