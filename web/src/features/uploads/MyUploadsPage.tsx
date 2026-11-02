import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { useHideTopBarControls } from '../../components/TopBar';
import { Icon, ProgressRing, Screen } from '../../components/ui';
import { summarize, useQueueItems } from '../capture/useQueueSummary';
import { useEvent } from '../entry/EventContext';
import { LoadingScreen } from '../entry/StatusScreens';
import type { PrivacyChoice } from '../privacy/privacyChoice';
import { formatDay, formatDuration, groupByDay, markFor, type DayLabel } from './grid';
import { mergeItems, type ServerItem, type UploadRow } from './mergeItems';
import { DeleteConfirm, UploadViewer } from './UploadViewer';
import { useNearViewport, usePreview } from './usePreview';

const api = () => import('./uploadsApi');
const queueModule = () => import('../../lib/queue');
const actions = () => import('../capture/captureActions');

/** Small paper disc for a tile mark (status, not a button). */
const disc = 'absolute flex size-6 items-center justify-center rounded-full';

/**
 * One square tile: the preview edge to edge, and a mark only when something
 * needs attention (D-093). Sent items carry none; a globe marks Awam items.
 */
function Tile({ row, label, onOpen }: { row: UploadRow; label: string; onOpen: () => void }) {
  const ref = useRef<HTMLButtonElement>(null);
  const preview = usePreview(row, useNearViewport(ref));
  const mark = markFor(row.status);
  return (
    <li className="relative aspect-square bg-paper-2">
      <button ref={ref} type="button" aria-label={label} onClick={onOpen} className="block size-full active:opacity-80">
        {preview ? (
          <img src={preview} alt="" className="size-full object-cover" />
        ) : (
          <span className="flex size-full items-center justify-center text-ink-2">
            <Icon name={row.type === 'video' ? 'video' : 'camera'} size={24} />
          </span>
        )}
        {mark === 'sending' ? (
          // The tile's label already says "Sedang dihantar n%".
          <span aria-hidden="true" className="absolute top-1 right-1">
            <ProgressRing percent={row.percent ?? 0} label="" size={40} />
          </span>
        ) : null}
        {mark === 'waiting' ? (
          <span className={`${disc} top-1.5 right-1.5 bg-paper text-ink`}>
            <Icon name="clock" size={16} />
          </span>
        ) : null}
        {mark === 'failed' ? (
          <span className={`${disc} top-1.5 right-1.5 bg-ink text-label font-bold text-paper`}>!</span>
        ) : null}
        {row.type === 'video' ? (
          <span className="absolute bottom-1.5 left-1.5 inline-flex items-center gap-0.5 rounded-full bg-paper py-0.5 pr-2 pl-1 text-label font-bold text-ink tabular-nums">
            <Icon name="play" size={14} />
            {row.durationMs ? formatDuration(row.durationMs) : null}
          </span>
        ) : null}
        {row.visibility === 'public' ? (
          <span className={`${disc} right-1.5 bottom-1.5 bg-paper text-ink`}>
            <Icon name="globe" size={16} />
          </span>
        ) : null}
      </button>
    </li>
  );
}

/**
 * `.../:eventSlug/mine`: everything this guest sent to the event, from this
 * phone's queue and the server, merged by mediaId, as a photo grid by day
 * (D-093). Tap an item to see it and change it. Tied to this phone and
 * browser (pitfall I2).
 */
export function MyUploadsPage() {
  const { t, i18n } = useTranslation();
  const event = useEvent();
  const navigate = useNavigate();
  useHideTopBarControls();
  const { items } = useQueueItems(event.eventId);
  const [server, setServer] = useState<ServerItem[] | null>(null);
  const [serverError, setServerError] = useState(false);
  const [overrides, setOverrides] = useState<Record<string, PrivacyChoice>>({});
  const [openId, setOpenId] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const menuPath = `/s/${event.publicId}/${event.eventSlug}`;
  const language = i18n.language;

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
  const days = useMemo(() => groupByDay(rows), [rows]);
  const summary = useMemo(() => summarize(items ?? []), [items]);
  // The item view follows the live row, so its status line moves on while it is open.
  const open = openId ? (rows.find((row) => row.mediaId === openId) ?? null) : null;

  const dayLabel = (label: DayLabel) =>
    label.kind === 'today' ? t('uploads.today') : label.kind === 'yesterday' ? t('uploads.yesterday') : formatDay(label.ms, language);
  const when = (row: UploadRow) =>
    new Intl.DateTimeFormat(language === 'en' ? 'en-GB' : 'ms-MY', {
      weekday: 'long',
      day: 'numeric',
      month: 'short',
      hour: 'numeric',
      minute: '2-digit',
    }).format(row.sortAtMs);
  const kind = (row: UploadRow) => (row.type === 'video' ? t('uploads.video') : t('uploads.photo'));
  const tileLabel = (row: UploadRow) =>
    [
      kind(row),
      when(row),
      t(`uploads.status.${row.status}`, { percent: row.percent ?? 0 }),
      t(row.visibility === 'public' ? 'privacy.publicTitle' : 'privacy.privateTitle'),
    ].join(', ');

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

  if (open && confirming) {
    return (
      <DeleteConfirm
        row={open}
        onCancel={() => setConfirming(false)}
        onConfirm={() => {
          setConfirming(false);
          setOpenId(null);
          void remove(open);
        }}
      />
    );
  }

  if (open) {
    return (
      <UploadViewer
        row={open}
        eventId={event.eventId}
        when={when(open)}
        onBack={() => setOpenId(null)}
        onPrivacy={(choice) => void changePrivacy(open, choice)}
        onRetry={() => void actions().then((m) => m.retryFailed(event.eventId, [open.mediaId]))}
        onSendNow={() => void actions().then((m) => m.sendHeld(event.eventId, [open.mediaId]))}
        onDelete={() => setConfirming(true)}
      />
    );
  }

  if (items === null || server === null) return <LoadingScreen />;

  const pending = summary.waiting + (summary.uploading ? 1 : 0);
  return (
    <Screen back={() => navigate(menuPath)} title={t('uploads.title')}>
      {/* One slim line, only while something is on its way (D-093). */}
      {pending > 0 || summary.held > 0 ? (
        <p role="status" className="-mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-label text-ink-2">
          {pending > 0 ? (
            <>
              <ProgressRing percent={summary.uploading?.percent} label={t('queue.progressLabel')} size={18} number={false} />
              {summary.uploading ? (
                <b className="text-ink">{t('uploads.status.uploading', { percent: summary.uploading.percent })}</b>
              ) : null}
              {summary.waiting > 0 ? <span>{t('uploads.waitingLine', { count: summary.waiting })}</span> : null}
            </>
          ) : null}
          {summary.held > 0 ? (
            <>
              <span>{t('queue.held', { count: summary.held })}</span>
              <button
                type="button"
                onClick={() => void actions().then((m) => m.sendHeld(event.eventId))}
                className="-my-3 inline-flex min-h-11 items-center px-1 font-bold text-ink underline underline-offset-2"
              >
                {t('queue.sendNow')}
              </button>
            </>
          ) : null}
        </p>
      ) : null}
      {message ? (
        <p role="status" className="text-caption text-ink">
          {message}
        </p>
      ) : null}
      {serverError ? (
        <p role="status" className="text-caption text-ink-2">
          {t('uploads.serverError')}
        </p>
      ) : null}

      {rows.length === 0 ? (
        <p>{t('uploads.empty')}</p>
      ) : (
        <div className="-mx-4 flex flex-col">
          {days.map((day) => (
            // Off-screen days skip layout and paint until scrolled near (long lists stay fast).
            <section key={day.key} className="[contain-intrinsic-size:auto_24rem] [content-visibility:auto]">
              <h2 className="px-4 pt-3 pb-2 text-caption font-bold text-ink">{dayLabel(day.label)}</h2>
              <ul className="grid grid-cols-3 gap-0.5">
                {day.rows.map((row) => (
                  <Tile key={row.mediaId} row={row} label={tileLabel(row)} onOpen={() => setOpenId(row.mediaId)} />
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
      <p className="text-label text-ink-2">{t('uploads.note')}</p>
    </Screen>
  );
}
