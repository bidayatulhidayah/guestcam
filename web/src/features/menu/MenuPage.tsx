import type { CaptureFeatureKey, FeatureKey } from '@guestcam/shared';
import { useEffect, useRef, useState, type ChangeEvent, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { Button, Icon, Screen, Tile, type IconName } from '../../components/ui';
import { allowUpdateOnReturn, holdUpdates } from '../../lib/device/serviceWorker';
import type { PreparedSelection } from '../capture/captureActions';
import { LargeFilePrompt } from '../capture/LargeFilePrompt';
import { QueueIndicator } from '../capture/QueueIndicator';
import { useQueueSummary } from '../capture/useQueueSummary';
import { CameraHelpPage } from '../device/CameraHelpPage';
import { useEvent } from '../entry/EventContext';
import { DEFAULT_CHOICE, readPrivacyChoice, savePrivacyChoice, type PrivacyChoice } from '../privacy/privacyChoice';
import { PrivacyPage } from '../privacy/PrivacyPage';
import { PrivacySwitch } from '../privacy/PrivacySwitch';
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
  /** The privacy choice changed: put it on the guest record. */
  onChoiceSaved: () => void;
}

/** Captures waiting for the first privacy answer: saved camera photos and/or a gallery selection. */
interface PrivacyQuestion {
  photoIds: string[];
  selection: PreparedSelection | null;
}

export function MenuPage({ displayName, galleryUnlocked, onUploaded, onChoiceSaved }: MenuPageProps) {
  const { t } = useTranslation();
  const event = useEvent();
  const summary = useQueueSummary(event.eventId);
  const navigate = useNavigate();
  const cameraInput = useRef<HTMLInputElement>(null);
  const galleryInput = useRef<HTMLInputElement>(null);
  const [showLockNotice, setShowLockNotice] = useState(false);
  const [notices, setNotices] = useState<string[]>([]);
  const [wifiQuestion, setWifiQuestion] = useState<PreparedSelection | null>(null);
  const [saving, setSaving] = useState(false);
  const [cameraCancelled, setCameraCancelled] = useState(false);
  const [cameraHelp, setCameraHelp] = useState(false);
  const [storageAcknowledged, setStorageAcknowledged] = useState(false);
  const [privacyChoice, setPrivacyChoice] = useState<PrivacyChoice | null>(() => readPrivacyChoice(event.eventId));
  const [privacyQuestion, setPrivacyQuestion] = useState<PrivacyQuestion | null>(null);

  // Until the first answer, captures are made as Peribadi and wait for the question.
  const context = { eventId: event.eventId, spaceId: event.spaceId, ...(privacyChoice ?? DEFAULT_CHOICE) };

  // Leaving the menu at the question: the waiting photos go as Peribadi, and the
  // question is asked again next time (no choice is saved).
  const waitingPhotos = useRef<string[]>([]);
  waitingPhotos.current = privacyQuestion?.photoIds ?? [];
  useEffect(
    () => () => {
      const ids = waitingPhotos.current;
      if (ids.length > 0) void actions().then((m) => m.choosePrivacy(ids, DEFAULT_CHOICE));
    },
    [],
  );

  // App updates may reload the menu when the guest comes back to it, but not
  // while a capture is being saved or the wifi question holds a selection.
  useEffect(() => {
    allowUpdateOnReturn(true);
    return () => allowUpdateOnReturn(false);
  }, []);
  useEffect(() => {
    holdUpdates(saving || wifiQuestion !== null || privacyQuestion !== null);
    return () => holdUpdates(false);
  }, [saving, wifiQuestion, privacyQuestion]);

  // The camera closed without a photo: maybe the guest changed their mind,
  // maybe the browser blocks it. Offer help without getting in the way (C6).
  useEffect(() => {
    const input = cameraInput.current;
    if (!input) return;
    const cancelled = () => setCameraCancelled(true);
    input.addEventListener('cancel', cancelled);
    return () => input.removeEventListener('cancel', cancelled);
  }, []);

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
    setSaving(true);
    try {
      const m = await actions();
      const { quotaFallback } = await m.commit(selection, holdLarge);
      const next: string[] = [];
      if (selection.ready.length > 0) next.push(t('capture.saved'));
      if (selection.resumed > 0) next.push(t('capture.repicked', { count: selection.resumed }));
      if (selection.tooLarge > 0) next.push(t('capture.tooLarge', { count: selection.tooLarge }));
      if (selection.unsupported > 0) next.push(t('capture.unsupported', { count: selection.unsupported }));
      if (quotaFallback) next.push(t('capture.storageFull'));
      setNotices(next);
    } finally {
      setSaving(false);
    }
  }

  async function handleFiles(event: ChangeEvent<HTMLInputElement>, source: 'snapshot' | 'galleryUpload') {
    const files = [...(event.target.files ?? [])];
    event.target.value = '';
    const first = files[0];
    if (!first) return;
    setSaving(true);
    try {
      const m = await actions();
      if (source === 'snapshot') {
        setCameraCancelled(false);
        const awaitChoice = privacyChoice === null;
        const photo = await m.takePhoto(first, context, awaitChoice);
        setNotices([
          ...(photo.mediaId ? [t('capture.saved')] : []),
          ...(photo.unsupported ? [t('capture.unsupported', { count: 1 })] : []),
          ...(photo.quotaFallback ? [t('capture.storageFull')] : []),
        ]);
        const mediaId = photo.mediaId;
        if (mediaId && awaitChoice) {
          setPrivacyQuestion((question) => ({
            photoIds: [...(question?.photoIds ?? []), mediaId],
            selection: question?.selection ?? null,
          }));
        }
        return;
      }
      const selection = await m.pickFromGallery(files, context);
      // Privacy first, then (for big files) the wifi question: one question per screen.
      if (privacyChoice === null) setPrivacyQuestion({ photoIds: [], selection });
      else if (m.needsWifiQuestion(selection)) setWifiQuestion(selection);
      else await finish(selection, false);
    } finally {
      setSaving(false);
    }
  }

  function changeChoice(choice: PrivacyChoice) {
    savePrivacyChoice(event.eventId, choice);
    setPrivacyChoice(choice);
    onChoiceSaved();
  }

  async function answerPrivacy(question: PrivacyQuestion, choice: PrivacyChoice) {
    changeChoice(choice);
    setPrivacyQuestion(null);
    const m = await actions();
    await m.choosePrivacy(question.photoIds, choice);
    if (!question.selection) return;
    const selection = m.withChoice(question.selection, choice);
    if (m.needsWifiQuestion(selection)) setWifiQuestion(selection);
    else await finish(selection, false);
  }

  // Always mounted, so "Cuba lagi" on a help screen can open the camera from its own tap.
  const pickers = (
    <>
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
    </>
  );

  const tiles = CAPTURE_TILES.filter((tile) => event.features.includes(tile.feature));
  const itemCount =
    summary.waiting + (summary.uploading ? 1 : 0) + summary.held + summary.needsRepick + summary.failed + summary.sent;
  const hasGallery = event.features.includes('publicGallery');
  // The pickers open from the tap itself (iOS needs a user gesture, pitfall C1).
  const open: Partial<Record<CaptureFeatureKey, () => void>> = {
    snapshot: () => cameraInput.current?.click(),
    galleryUpload: () => galleryInput.current?.click(),
  };

  let content: ReactNode;
  if (cameraHelp) {
    content = (
      <CameraHelpPage
        onRetry={() => {
          setCameraHelp(false);
          cameraInput.current?.click();
        }}
        onContinue={() => {
          setCameraHelp(false);
          setCameraCancelled(false);
          setNotices([t('device.useGalleryHint', { upload: t('menu.galleryUpload') })]);
        }}
      />
    );
  } else if (privacyQuestion) {
    content = <PrivacyPage onDone={(choice) => void answerPrivacy(privacyQuestion, choice)} />;
  } else if (wifiQuestion) {
    content = (
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
  } else {
    content = (
      <Screen>
        <CoupleHeader event={event} />
        <p className="-mt-4 mb-2 font-bold">{t('menu.greeting', { name: displayName })}</p>

        <QueueIndicator
          summary={summary}
          onSendNow={() => void actions().then((m) => m.sendHeld(event.eventId))}
          onRepick={() => galleryInput.current?.click()}
          onRetry={() => void actions().then((m) => m.retryFailed(event.eventId))}
        />
        {summary.memoryOnly && !storageAcknowledged ? (
          <section role="alert" className="flex flex-col gap-3 rounded-card border border-line bg-paper-2 p-4">
            <p>{t('device.storageBlocked')}</p>
            <Button onClick={() => setStorageAcknowledged(true)}>{t('device.continueWithoutStorage')}</Button>
          </section>
        ) : null}
        {notices.map((notice) => (
          <p key={notice} role="status" className="text-caption">
            {notice}
          </p>
        ))}
        {cameraCancelled ? <Button onClick={() => setCameraHelp(true)}>{t('device.cameraNotOpened')}</Button> : null}
        {privacyChoice ? <PrivacySwitch choice={privacyChoice} onChange={changeChoice} /> : null}

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

        {itemCount > 0 ? (
          <Button icon={<Icon name="upload" />} onClick={() => navigate('mine')}>
            {t('uploads.openButton')}
          </Button>
        ) : null}

        {showLockNotice && !galleryUnlocked ? (
          <section role="status" className="flex flex-col gap-3 rounded-card bg-paper-2 p-4">
            <p>{t('menu.galleryLockedNotice')}</p>
            {open.snapshot && tiles.some((tile) => tile.feature === 'snapshot') ? (
              <Button icon={<Icon name="camera" />} onClick={open.snapshot}>
                {t('menu.snapshot')}
              </Button>
            ) : null}
          </section>
        ) : null}
      </Screen>
    );
  }

  // The pickers stay first in every state, so React keeps the same input elements.
  return (
    <>
      {pickers}
      {content}
    </>
  );
}
