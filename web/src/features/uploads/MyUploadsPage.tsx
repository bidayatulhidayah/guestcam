import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { Button, Icon, Screen } from '../../components/ui';
import { useQueueItems } from '../capture/useQueueSummary';
import { useEvent } from '../entry/EventContext';
import { LoadingScreen } from '../entry/StatusScreens';
import type { PrivacyChoice } from '../privacy/privacyChoice';
import { PrivacySwitch } from '../privacy/PrivacySwitch';
import { mergeItems, type ServerItem, type UploadRow } from './mergeItems';

const api = () => import('./uploadsApi');
const queueModule = () => import('../../lib/queue');
const actions = () => import('../capture/captureActions');

/** The small preview kept on this phone (photos only); null shows the icon instead. */
function usePreview(row: UploadRow): string | null {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!row.local || row.type !== 'image') return;
    let active = true;
    let objectUrl: string | undefined;
    queueModule()
      .then((m) => m.getQueueDb())
      .then((db) => db.thumbs.get(row.mediaId))
      .then((thumb) => {
        if (!active || !thumb) return;
        objectUrl = URL.createObjectURL(thumb.blob);
        setUrl(objectUrl);
      })
      .catch(() => undefined);
    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
    // The preview is made in the background: look again when the status moves on.
  }, [row.mediaId, row.local, row.type, row.status]);
  return url;
}

interface RowProps {
  row: UploadRow;
  onPrivacy: (choice: PrivacyChoice) => void;
  onDelete: () => void;
  onRetry: () => void;
  onSendNow: () => void;
}

function UploadItem({ row, onPrivacy, onDelete, onRetry, onSendNow }: RowProps) {
  const { t, i18n } = useTranslation();
  const preview = usePreview(row);
  const kind = row.type === 'image' ? t('uploads.photo') : row.type === 'video' ? t('uploads.video') : t('uploads.audio');
  const when = row.createdAtMs
    ? new Date(row.createdAtMs).toLocaleString(i18n.language === 'en' ? 'en-MY' : 'ms-MY', {
        day: 'numeric',
        month: 'short',
        hour: 'numeric',
        minute: '2-digit',
      })
    : '';
  return (
    <li className="flex flex-col gap-3 border-b border-line py-4">
      <div className="flex items-center gap-4">
        {preview ? (
          <img src={preview} alt="" className="size-20 shrink-0 rounded-card border border-line object-cover" />
        ) : (
          <span
            aria-hidden="true"
            className="flex size-20 shrink-0 items-center justify-center rounded-card border border-line bg-paper-2 text-ink-2"
          >
            <Icon name={row.type === 'video' ? 'video' : 'camera'} />
          </span>
        )}
        <span className="flex flex-col gap-1">
          <span className="font-bold">
            {kind}
            {when ? <span className="font-normal text-ink-2"> · {when}</span> : null}
          </span>
          <span className="text-caption">{t(`uploads.status.${row.status}`, { percent: row.percent ?? 0 })}</span>
        </span>
      </div>
      <PrivacySwitch choice={{ visibility: row.visibility, showName: row.showName }} onChange={onPrivacy} />
      {row.status === 'failed' ? <Button onClick={onRetry}>{t('common.retry')}</Button> : null}
      {row.status === 'held' ? <Button onClick={onSendNow}>{t('queue.sendNow')}</Button> : null}
      <Button icon={<Icon name="trash" />} onClick={onDelete}>
        {t('uploads.delete')}
      </Button>
    </li>
  );
}

/**
 * `.../:eventSlug/mine`: everything this guest sent to the event, from this
 * phone's queue and the server, merged by mediaId. Switch Peribadi / Awam or
 * delete any item. Tied to this phone and browser (pitfall I2).
 */
export function MyUploadsPage() {
  const { t } = useTranslation();
  const event = useEvent();
  const navigate = useNavigate();
  const { items } = useQueueItems(event.eventId);
  const [server, setServer] = useState<ServerItem[] | null>(null);
  const [serverError, setServerError] = useState(false);
  const [overrides, setOverrides] = useState<Record<string, PrivacyChoice>>({});
  const [confirming, setConfirming] = useState<UploadRow | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const menuPath = `/s/${event.publicId}/${event.eventSlug}`;

  const refresh = useCallback(() => {
    api()
      .then((m) => m.listMyServerItems(event.eventId))
      .then((list) => {
        setServer(list);
        setServerError(false);
        setOverrides({});
      })
      .catch(() => {
        setServerError(true);
        setServer((current) => current ?? []);
      });
  }, [event.eventId]);

  useEffect(() => refresh(), [refresh]);

  // An item reached the server: its status there has changed.
  useEffect(() => {
    let stop: (() => void) | undefined;
    let active = true;
    actions()
      .then((m) => m.onItemSent(refresh))
      .then((unsubscribe) => (active ? (stop = unsubscribe) : unsubscribe()))
      .catch(() => undefined);
    return () => {
      active = false;
      stop?.();
    };
  }, [refresh]);

  const rows = useMemo(
    () =>
      mergeItems(items ?? [], server ?? []).map((row) =>
        overrides[row.mediaId] ? { ...row, ...overrides[row.mediaId] } : row,
      ),
    [items, server, overrides],
  );

  async function attempt(action: () => Promise<void>) {
    setMessage(null);
    try {
      await action();
    } catch {
      setMessage(t('uploads.actionFailed'));
    }
  }

  const changePrivacy = (row: UploadRow, choice: PrivacyChoice) =>
    attempt(async () => {
      setOverrides((current) => ({ ...current, [row.mediaId]: choice }));
      // Not on the server yet: the queue creates the doc with the new choice.
      if (row.local) await (await (await queueModule()).getQueue()).setVisibility(row.mediaId, choice.visibility, choice.showName);
      if (row.hasDoc) await (await api()).setServerVisibility(event.eventId, row.mediaId, choice.visibility, choice.showName);
    });

  const remove = (row: UploadRow) =>
    attempt(async () => {
      let hasDoc = row.hasDoc;
      if (row.local) {
        const { docCreated } = await (await (await queueModule()).getQueue()).remove(row.mediaId);
        hasDoc ||= docCreated;
      }
      if (hasDoc) await (await api()).deleteServerItem(event.eventId, row.mediaId);
      setServer((current) => current?.filter((item) => item.mediaId !== row.mediaId) ?? current);
      setMessage(t('uploads.deleted'));
    });

  if (confirming) {
    return (
      <Screen
        title={t('uploads.deleteTitle')}
        bottom={
          <>
            <Button
              variant="danger"
              icon={<Icon name="trash" />}
              onClick={() => {
                const row = confirming;
                setConfirming(null);
                void remove(row);
              }}
            >
              {t('uploads.delete')}
            </Button>
            <Button onClick={() => setConfirming(null)}>{t('uploads.cancel')}</Button>
          </>
        }
      >
        <p>{t('uploads.deleteBody')}</p>
      </Screen>
    );
  }

  if (items === null || server === null) return <LoadingScreen />;

  return (
    <Screen
      eyebrow={event.displayNames}
      title={t('uploads.title')}
      bottom={<Button onClick={() => navigate(menuPath)}>{t('uploads.back')}</Button>}
    >
      <p className="text-caption text-ink-2">{t('uploads.note')}</p>
      {message ? (
        <p role="status" className="rounded-card bg-paper-2 p-4">
          {message}
        </p>
      ) : null}
      {serverError ? (
        <p role="status" className="rounded-card bg-paper-2 p-4">
          {t('uploads.serverError')}
        </p>
      ) : null}
      {rows.length === 0 ? (
        <p>{t('uploads.empty')}</p>
      ) : (
        <ul className="flex flex-col border-t border-line">
          {rows.map((row) => (
            <UploadItem
              key={row.mediaId}
              row={row}
              onPrivacy={(choice) => void changePrivacy(row, choice)}
              onDelete={() => setConfirming(row)}
              onRetry={() => void actions().then((m) => m.retryFailed(event.eventId))}
              onSendNow={() => void actions().then((m) => m.sendHeld(event.eventId))}
            />
          ))}
        </ul>
      )}
    </Screen>
  );
}
