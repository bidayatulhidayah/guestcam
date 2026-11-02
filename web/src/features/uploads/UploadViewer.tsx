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
 * My Uploads item view (D-093): the photo (up to 60% of the screen) or a
 * video that plays, one status line, and the item's settings as 48 px
 * controls with words. Taps only: no swiping between items.
 */
export function UploadViewer({ row, eventId, when, onBack, onPrivacy, onRetry, onSendNow, onDelete }: UploadViewerProps) {
  const { t } = useTranslation();
  const preview = usePreview(row);
  const [original, failed] = useOriginal(eventId, row.mediaId);
  const controls = viewerControls(row);
  const kind = row.type === 'video' ? t('uploads.video') : t('uploads.photo');
  const problem = row.status === 'failed' || row.status === 'rejected' || row.status === 'notArrived';
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
    <Screen
      back={onBack}
      bottom={
        <div className={action ? 'grid grid-cols-2 gap-3' : 'flex flex-col'}>
          {action}
          <Button variant="dangerOutline" icon={<Icon name="trash" />} onClick={onDelete}>
            {t('uploads.delete')}
          </Button>
        </div>
      }
    >
      <div className="-mx-4 flex h-[60dvh] items-center justify-center overflow-hidden bg-paper-2">
        {row.type === 'video' && original.status === 'ready' ? (
          <video
            src={original.url}
            {...(preview ? { poster: preview } : {})}
            controls
            playsInline
            className="max-h-full w-full bg-ink"
            onError={failed}
          />
        ) : original.status === 'ready' || preview ? (
          <img
            src={original.status === 'ready' ? original.url : (preview ?? '')}
            alt={`${kind}, ${when}`}
            className="max-h-full w-full object-contain"
            // The server copy may not load (offline): the preview stays.
            onError={failed}
          />
        ) : (
          <span role="img" aria-label={`${kind}, ${when}`} className="text-ink-2">
            <Icon name={row.type === 'video' ? 'video' : 'camera'} size={40} />
          </span>
        )}
      </div>
      {row.type === 'video' && original.status === 'failed' ? (
        <p role="status" className="text-caption text-ink-2">
          {t('uploads.playFailed')}
        </p>
      ) : null}

      <p className="flex items-baseline justify-between gap-3 text-caption">
        <b className={problem ? 'text-danger' : 'text-ink'}>{t(`uploads.status.${row.status}`, { percent: row.percent ?? 0 })}</b>
        <span className="text-right text-ink-2">{when}</span>
      </p>

      {/* The chosen option is a tint, so the accent stays for the one main action (design.md). */}
      <div role="group" aria-label={t('privacy.title')} className="grid grid-cols-2 overflow-hidden rounded-card border border-ink">
        {(['private', 'public'] as const).map((visibility) => {
          const chosen = row.visibility === visibility;
          return (
            <button
              key={visibility}
              type="button"
              aria-pressed={chosen}
              onClick={() => onPrivacy({ visibility, showName: visibility === 'public' && row.showName })}
              className={[
                'inline-flex min-h-12 items-center justify-center gap-2 font-bold text-ink',
                chosen ? 'bg-accent-tint shadow-[inset_0_0_0_2px_var(--accent)]' : 'active:bg-paper-2',
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
          {/* Outlined in ink-2 when off, so the control keeps 3:1 against the paper. */}
          <span
            aria-hidden="true"
            className={[
              'relative inline-block h-6 w-11 shrink-0 rounded-full border-2 transition-colors duration-150',
              row.showName ? 'border-ink bg-ink' : 'border-ink-2 bg-paper',
            ].join(' ')}
          >
            <span
              className={[
                'absolute top-0 size-5 rounded-full transition-[left] duration-150',
                row.showName ? 'left-5 bg-paper' : 'left-0 bg-ink-2',
              ].join(' ')}
            />
          </span>
        </button>
      ) : null}
    </Screen>
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
