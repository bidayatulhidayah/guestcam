import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Icon, Screen } from '../../components/ui';
import type { PrivacyChoice } from '../privacy/privacyChoice';
import { viewerControls } from './grid';
import type { UploadRow } from './mergeItems';
import { usePreview } from './usePreview';

type OriginalState = { status: 'loading' } | { status: 'ready'; url: string } | { status: 'failed' };

/**
 * The guest's own photo or video, only once they opened it (an explicit tap,
 * rule 6): this phone's copy, or their original on the server (D-091). The
 * browser streams it; nothing is downloaded whole into memory.
 */
function useOriginal(eventId: string, mediaId: string): [OriginalState, () => void] {
  const [state, setState] = useState<OriginalState>({ status: 'loading' });
  useEffect(() => {
    let active = true;
    let objectUrl: string | undefined;
    import('./originalSource')
      .then((m) => m.originalSource(eventId, mediaId))
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
  return [state, () => setState({ status: 'failed' })];
}

export interface UploadViewerProps {
  row: UploadRow;
  eventId: string;
  /** "Sabtu, 14 Nov · 8:42 PM" in the guest's language. */
  when: string;
  onBack: () => void;
  onPrivacy: (choice: PrivacyChoice) => void;
  onRetry: () => void;
  onSendNow: () => void;
  onDelete: () => void;
}

/**
 * My Uploads item view, full screen like a phone's gallery viewer (D-094):
 * the photo or video at its own shape and full quality (this phone's copy or
 * the guest's own original; the small preview only until it arrives),
 * fitted to the screen on dark ink, a slim "Kembali" bar on top and the
 * item's settings below as 48 px controls with words. Taps only: no swiping.
 */
export function UploadViewer({ row, eventId, when, onBack, onPrivacy, onRetry, onSendNow, onDelete }: UploadViewerProps) {
  const { t } = useTranslation();
  const preview = usePreview(row);
  const [original, failed] = useOriginal(eventId, row.mediaId);
  const controls = viewerControls(row);
  const kind = row.type === 'video' ? t('uploads.video') : t('uploads.photo');

  // The page behind must not scroll while the viewer covers it.
  useEffect(() => {
    const before = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = before;
    };
  }, []);

  const action = controls.retry ? (
    <Button variant="primary" icon={<Icon name="retry" />} onClick={onRetry}>
      {t('common.retry')}
    </Button>
  ) : controls.sendNow ? (
    <Button variant="primary" icon={<Icon name="upload" />} onClick={onSendNow}>
      {t('queue.sendNow')}
    </Button>
  ) : null;

  return (
    <div role="dialog" aria-modal="true" aria-label={`${kind}, ${when}`} className="fixed inset-0 z-50 flex flex-col bg-ink text-paper">
      <div className="flex items-center justify-between gap-3 px-2 pt-[max(0.5rem,env(safe-area-inset-top))]">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex min-h-11 items-center gap-1 px-2 text-caption text-paper active:text-line"
        >
          <Icon name="arrowLeft" size={20} />
          {t('common.back')}
        </button>
        <span className="truncate px-2 text-label text-line">{when}</span>
      </div>

      {/* Fitted to the screen at its own shape, never cropped; pinch-zoom works as on any page. */}
      <div className="flex min-h-0 flex-1 items-center justify-center">
        {row.type === 'video' && original.status === 'ready' ? (
          <video
            src={original.url}
            {...(preview ? { poster: preview } : {})}
            controls
            playsInline
            className="size-full object-contain"
            onError={failed}
          />
        ) : original.status === 'ready' || preview ? (
          <img
            src={original.status === 'ready' ? original.url : (preview ?? '')}
            alt={`${kind}, ${when}`}
            className="size-full object-contain"
            // The full file may not load (offline, or a format this phone cannot show): the preview stays.
            onError={failed}
          />
        ) : (
          <span role="img" aria-label={`${kind}, ${when}`} className="text-line">
            <Icon name={row.type === 'video' ? 'video' : 'camera'} size={48} />
          </span>
        )}
      </div>

      <div className="flex flex-col gap-3 px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
        {row.type === 'video' && original.status === 'failed' ? (
          <p role="status" className="text-caption text-line">
            {t('uploads.playFailed')}
          </p>
        ) : null}
        <p className="text-caption font-bold text-paper">{t(`uploads.status.${row.status}`, { percent: row.percent ?? 0 })}</p>

        {/* The chosen part is filled in paper, so the accent stays for the one main action (design.md). */}
        <div role="group" aria-label={t('privacy.title')} className="grid grid-cols-2 overflow-hidden rounded-card border border-line">
          {(['private', 'public'] as const).map((visibility) => {
            const chosen = row.visibility === visibility;
            return (
              <button
                key={visibility}
                type="button"
                aria-pressed={chosen}
                onClick={() => onPrivacy({ visibility, showName: visibility === 'public' && row.showName })}
                className={[
                  'inline-flex min-h-12 items-center justify-center gap-2 font-bold',
                  chosen ? 'bg-paper text-ink' : 'text-paper active:bg-ink-2',
                ].join(' ')}
              >
                <Icon name={visibility === 'public' ? 'globe' : 'lock'} size={20} />
                {t(visibility === 'public' ? 'privacy.publicTitle' : 'privacy.privateTitle')}
              </button>
            );
          })}
        </div>

        {controls.showName ? (
          <button
            type="button"
            role="switch"
            aria-checked={row.showName}
            onClick={() => onPrivacy({ visibility: 'public', showName: !row.showName })}
            className="flex min-h-12 items-center justify-between gap-3 text-left"
          >
            <span className="inline-flex items-center gap-2">
              <Icon name="user" size={20} />
              {t('uploads.showName')}
            </span>
            {/* Outlined in the light hairline when off, so the control keeps 3:1 on the dark panel. */}
            <span
              aria-hidden="true"
              className={[
                'relative inline-block h-6 w-11 shrink-0 rounded-full border-2 transition-colors duration-150',
                row.showName ? 'border-paper bg-paper' : 'border-line bg-ink',
              ].join(' ')}
            >
              <span
                className={[
                  'absolute top-0 size-5 rounded-full transition-[left] duration-150',
                  row.showName ? 'left-5 bg-ink' : 'left-0 bg-line',
                ].join(' ')}
              />
            </span>
          </button>
        ) : null}

        <div className={action ? 'grid grid-cols-2 gap-3' : 'flex flex-col'}>
          {action}
          <Button variant="onDark" icon={<Icon name="trash" />} onClick={onDelete}>
            {t('uploads.delete')}
          </Button>
        </div>
      </div>
    </div>
  );
}

/** Padam asks on its own screen in the app, never in a browser dialog. */
export function DeleteConfirm({ row, onConfirm, onCancel }: { row: UploadRow; onConfirm: () => void; onCancel: () => void }) {
  const { t } = useTranslation();
  const preview = usePreview(row);
  return (
    <Screen
      back={onCancel}
      title={t('uploads.deleteTitle')}
      bottom={
        <>
          <Button variant="danger" icon={<Icon name="trash" />} onClick={onConfirm}>
            {t('uploads.delete')}
          </Button>
          <Button onClick={onCancel}>{t('uploads.cancel')}</Button>
        </>
      }
    >
      {preview ? <img src={preview} alt="" className="size-24 object-cover" /> : null}
      <p>{t('uploads.deleteBody')}</p>
    </Screen>
  );
}
