import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { Button, Icon, Screen, type IconName } from '../../components/ui';
import { useQueueItems } from '../capture/useQueueSummary';
import { useEvent } from '../entry/EventContext';
import { LoadingScreen } from '../entry/StatusScreens';
import type { PrivacyChoice } from '../privacy/privacyChoice';
import { mergeItems, type ServerItem, type UploadRow } from './mergeItems';

const api = () => import('./uploadsApi');
const queueModule = () => import('../../lib/queue');
const actions = () => import('../capture/captureActions');

/**
 * The small preview kept on this phone (photo, or a video's first frame); null
 * shows the neutral placeholder. Items from another phone have none until
 * server thumbnails arrive (Phase 3).
 */
function usePreview(row: UploadRow): string | null {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!row.local || row.preview === 'none') return;
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
    // The preview is made in the background: saving it sets `preview` on the item.
  }, [row.mediaId, row.local, row.preview]);
  return url;
}

/** Statuses that need the guest (or "Cuba lagi"): an exclamation mark in the corner. */
const PROBLEM: ReadonlySet<UploadRow['status']> = new Set(['failed', 'needsRepick', 'rejected']);

/** Small corner mark: a dot with a check once sent, a ring while sending, an empty ring while waiting. */
function StatusMark({ row, label }: { row: UploadRow; label: string }) {
  const base = 'absolute top-2 right-2 flex size-7 items-center justify-center rounded-full';
  if (row.status === 'sent') {
    return (
      <span role="img" aria-label={label} className={`${base} bg-accent text-on-accent`}>
        <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="currentColor" strokeWidth={3} aria-hidden="true">
          <path d="m5 12 5 5 9-10" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    );
  }
  if (row.status === 'uploading') {
    const circumference = 2 * Math.PI * 9;
    return (
      <span role="img" aria-label={label} className={`${base} bg-paper`}>
        <svg viewBox="0 0 24 24" width={24} height={24} aria-hidden="true" className="-rotate-90">
          <circle cx="12" cy="12" r="9" fill="none" className="stroke-line" strokeWidth={3} />
          <circle
            cx="12"
            cy="12"
            r="9"
            fill="none"
            className="stroke-accent"
            strokeWidth={3}
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - (row.percent ?? 0) / 100)}
          />
        </svg>
      </span>
    );
  }
  if (PROBLEM.has(row.status)) {
    return (
      <span role="img" aria-label={label} className={`${base} bg-ink text-caption font-bold text-paper`}>
        !
      </span>
    );
  }
  return <span role="img" aria-label={label} className={`${base} border-[3px] border-ink-2 bg-paper`} />;
}

/** 48px icon-only button: the design.md exception for My Uploads, so every one has an aria-label. */
function ItemButton({ label, icon, onClick }: { label: string; icon: IconName; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className="flex size-12 items-center justify-center rounded-card text-ink active:bg-paper-2"
    >
      <Icon name={icon} size={24} />
    </button>
  );
}

interface ItemProps {
  row: UploadRow;
  onPrivacy: (choice: PrivacyChoice) => void;
  onDelete: () => void;
}

function UploadItem({ row, onPrivacy, onDelete }: ItemProps) {
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
  const status = t(`uploads.status.${row.status}`, { percent: row.percent ?? 0 });
  const isPublic = row.visibility === 'public';
  return (
    <li className="flex flex-col gap-1">
      {/* Printed-photo border (design.md); the words are for screen readers only. */}
      <div className="relative aspect-square border border-line bg-paper p-1.5">
        {preview ? (
          <>
            <img src={preview} alt={`${kind}, ${when}`} className="size-full object-cover" />
            {row.type === 'video' ? (
              <span
                aria-hidden="true"
                className="absolute inset-0 m-auto flex size-10 items-center justify-center rounded-full border border-line bg-paper text-ink"
              >
                <Icon name="play" size={20} />
              </span>
            ) : null}
          </>
        ) : (
          <span
            role="img"
            aria-label={`${kind}, ${when}`}
            className="flex size-full items-center justify-center bg-paper-2 text-ink-2"
          >
            <Icon name={row.type === 'video' ? 'video' : 'camera'} size={32} />
          </span>
        )}
        <StatusMark row={row} label={status} />
      </div>
      <div className="flex items-center justify-between">
        <ItemButton
          icon={isPublic ? 'globe' : 'lock'}
          label={t(isPublic ? 'uploads.icons.public' : 'uploads.icons.private')}
          onClick={() => onPrivacy({ visibility: isPublic ? 'private' : 'public', showName: row.showName })}
        />
        {isPublic ? (
          <ItemButton
            icon={row.showName ? 'user' : 'userHidden'}
            label={t(row.showName ? 'uploads.icons.nameShown' : 'uploads.icons.nameHidden')}
            onClick={() => onPrivacy({ visibility: 'public', showName: !row.showName })}
          />
        ) : null}
        <ItemButton icon="trash" label={t('uploads.delete')} onClick={onDelete} />
      </div>
    </li>
  );
}

/** One line above the grid: what the small icons mean. */
function Legend() {
  const { t } = useTranslation();
  const entries: { icon: IconName | 'sent'; label: string }[] = [
    { icon: 'lock', label: t('privacy.privateTitle') },
    { icon: 'globe', label: t('privacy.publicTitle') },
    { icon: 'user', label: t('uploads.legendName') },
    { icon: 'sent', label: t('uploads.status.sent') },
  ];
  return (
    <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-caption text-ink-2">
      {entries.map((entry) => (
        <span key={entry.label} className="inline-flex items-center gap-1">
          {entry.icon === 'sent' ? (
            <span aria-hidden="true" className="inline-block size-3 rounded-full bg-accent" />
          ) : (
            <Icon name={entry.icon} size={16} />
          )}
          {entry.label}
        </span>
      ))}
    </p>
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
      {rows.some((row) => row.status === 'failed') ? (
        <Button onClick={() => void actions().then((m) => m.retryFailed(event.eventId))}>{t('common.retry')}</Button>
      ) : null}
      {rows.some((row) => row.status === 'held') ? (
        <Button onClick={() => void actions().then((m) => m.sendHeld(event.eventId))}>{t('queue.sendNow')}</Button>
      ) : null}
      {rows.length === 0 ? (
        <p>{t('uploads.empty')}</p>
      ) : (
        <>
          <Legend />
          {/* Two columns keep three 48px icons under each preview on a 360px phone. */}
          <ul className="grid grid-cols-2 gap-x-4 gap-y-3 min-[480px]:grid-cols-3">
            {rows.map((row) => (
              <UploadItem
                key={row.mediaId}
                row={row}
                onPrivacy={(choice) => void changePrivacy(row, choice)}
                onDelete={() => setConfirming(row)}
              />
            ))}
          </ul>
        </>
      )}
    </Screen>
  );
}
