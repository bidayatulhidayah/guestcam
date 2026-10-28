import type { CaptureFeatureKey, FeatureKey } from '@guestcam/shared';
import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Icon, Screen, Tile, type IconName } from '../../components/ui';
import type { PreparedSelection } from '../capture/captureActions';
import { LargeFilePrompt } from '../capture/LargeFilePrompt';
import { QueueIndicator } from '../capture/QueueIndicator';
import { useQueueSummary } from '../capture/useQueueSummary';
import { useEvent } from '../entry/EventContext';
import { CoupleHeader } from '../onboarding/CoupleHeader';

/** Menu order (D-045). Only effective features appear; the grid reflows. */
const CAPTURE_TILES: { feature: CaptureFeatureKey; icon: IconName }[] = [
  { feature: 'snapshot', icon: 'camera' },
  { feature: 'galleryUpload', icon: 'upload' },
  { feature: 'videoWish', icon: 'video' },
  { feature: 'boomerang', icon: 'boomerang' },
  { feature: 'voiceCall', icon: 'phone' },
  { feature: 'textWish', icon: 'letter' },
  { feature: 'sharedFolder', icon: 'folderLock' },
];

/** Functions built so far; the rest show "Akan datang". */
const READY: ReadonlySet<FeatureKey> = new Set<FeatureKey>(['snapshot', 'galleryUpload']);

const actions = () => import('../capture/captureActions');

export interface MenuPageProps {
  displayName: string;
  galleryUnlocked: boolean;
  /** An item reached the server: the gallery may have just unlocked. */
  onUploaded: () => void;
}

export function MenuPage({ displayName, galleryUnlocked, onUploaded }: MenuPageProps) {
  const { t } = useTranslation();
  const event = useEvent();
  const summary = useQueueSummary(event.eventId);
  const cameraInput = useRef<HTMLInputElement>(null);
  const galleryInput = useRef<HTMLInputElement>(null);
  const [showLockNotice, setShowLockNotice] = useState(false);
  const [notices, setNotices] = useState<string[]>([]);
  const [wifiQuestion, setWifiQuestion] = useState<PreparedSelection | null>(null);

  // Privacy step and "show my name" arrive in 1c; until then every item is private.
  const context = { eventId: event.eventId, spaceId: event.spaceId, visibility: 'private' as const, showName: false };

  useEffect(() => {
    let stop: (() => void) | undefined;
    let active = true;
    actions()
      .then((m) => m.onItemSent(onUploaded))
      .then((unsubscribe) => (active ? (stop = unsubscribe) : unsubscribe()))
      .catch(() => undefined);
    return () => {
      active = false;
      stop?.();
    };
  }, [onUploaded]);

  async function finish(selection: PreparedSelection, holdLarge: boolean) {
    const m = await actions();
    const { quotaFallback } = await m.commit(selection, holdLarge);
    const next: string[] = [];
    if (selection.ready.length > 0) next.push(t('capture.saved'));
    if (selection.resumed > 0) next.push(t('capture.repicked', { count: selection.resumed }));
    if (selection.tooLarge > 0) next.push(t('capture.tooLarge', { count: selection.tooLarge }));
    if (selection.unsupported > 0) next.push(t('capture.unsupported', { count: selection.unsupported }));
    if (quotaFallback) next.push(t('capture.storageFull'));
    setNotices(next);
  }

  async function handleFiles(event: ChangeEvent<HTMLInputElement>, source: 'snapshot' | 'galleryUpload') {
    const files = [...(event.target.files ?? [])];
    event.target.value = '';
    const first = files[0];
    if (!first) return;
    const m = await actions();
    if (source === 'snapshot') {
      const photo = await m.takePhoto(first, context);
      setNotices([
        ...(photo.saved ? [t('capture.saved')] : []),
        ...(photo.unsupported ? [t('capture.unsupported', { count: 1 })] : []),
        ...(photo.quotaFallback ? [t('capture.storageFull')] : []),
      ]);
      return;
    }
    const selection = await m.pickFromGallery(files, context);
    if (m.needsWifiQuestion(selection)) setWifiQuestion(selection);
    else await finish(selection, false);
  }

  if (wifiQuestion) {
    return (
      <LargeFilePrompt
        largestBytes={wifiQuestion.largestBytes}
        onNow={() => {
          void finish(wifiQuestion, false);
          setWifiQuestion(null);
        }}
        onLater={() => {
          void finish(wifiQuestion, true);
          setWifiQuestion(null);
        }}
      />
    );
  }

  const tiles = CAPTURE_TILES.filter((tile) => event.features.includes(tile.feature));
  const hasGallery = event.features.includes('publicGallery');
  // The pickers open from the tap itself (iOS needs a user gesture, pitfall C1).
  const open: Partial<Record<CaptureFeatureKey, () => void>> = {
    snapshot: () => cameraInput.current?.click(),
    galleryUpload: () => galleryInput.current?.click(),
  };

  return (
    <Screen>
      <CoupleHeader event={event} />
      <p className="-mt-4 mb-2 font-bold">{t('menu.greeting', { name: displayName })}</p>

      <QueueIndicator
        summary={summary}
        onSendNow={() => void actions().then((m) => m.sendHeld(event.eventId))}
        onRepick={() => galleryInput.current?.click()}
        onRetry={() => void actions().then((m) => m.retryFailed(event.eventId))}
      />
      {notices.map((notice) => (
        <p key={notice} role="status" className="text-caption">
          {notice}
        </p>
      ))}

      <nav aria-label={event.displayNames} className="grid grid-cols-2 gap-4">
        {tiles.map((tile, index) => {
          const ready = READY.has(tile.feature);
          return (
            <Tile
              key={tile.feature}
              icon={<Icon name={tile.icon} />}
              label={t(`menu.${tile.feature}`)}
              disabled={!ready}
              {...(ready ? { onClick: open[tile.feature] } : { note: t('menu.comingSoon') })}
              // An odd last tile spans the full width (design.md).
              wide={index === tiles.length - 1 && tiles.length % 2 === 1}
            />
          );
        })}
        {hasGallery ? (
          galleryUnlocked ? (
            <Tile icon={<Icon name="gallery" />} label={t('menu.gallery')} to="gallery" wide />
          ) : (
            <Tile
              icon={<Icon name="lock" />}
              label={t('menu.gallery')}
              note={t('menu.locked')}
              onClick={() => setShowLockNotice(true)}
              wide
            />
          )
        ) : null}
      </nav>

      {showLockNotice && !galleryUnlocked ? (
        <p role="status" className="rounded-card bg-paper-2 p-4">
          {t('menu.galleryLockedNotice')}
        </p>
      ) : null}

      <input
        ref={cameraInput}
        type="file"
        accept="image/*"
        capture="environment"
        hidden
        onChange={(e) => void handleFiles(e, 'snapshot')}
      />
      <input
        ref={galleryInput}
        type="file"
        accept="image/*,video/*"
        multiple
        hidden
        onChange={(e) => void handleFiles(e, 'galleryUpload')}
      />
    </Screen>
  );
}
