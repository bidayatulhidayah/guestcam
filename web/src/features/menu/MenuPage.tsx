import type { CaptureFeatureKey, FeatureKey } from '@guestcam/shared';
import { useEffect, useRef, useState, type ChangeEvent, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { Button, Icon, Screen, Tile, type IconName } from '../../components/ui';
import { allowUpdateOnReturn, holdUpdates } from '../../lib/device/serviceWorker';
import type { PreparedSelection } from '../capture/captureActions';
import { LargeFilePrompt } from '../capture/LargeFilePrompt';
import { QueueIndicator } from '../capture/QueueIndicator';
import { SnapScreen } from '../capture/SnapScreen';
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

/** Captures waiting for the first privacy answer: saved camera captures and/or a gallery selection. */
interface PrivacyQuestion {
  cameraIds: string[];
  /** Camera videos over 50 MB among them: the wifi question comes next. */
  heldIds: string[];
  heldBytes: number;
  selection: PreparedSelection | null;
}

/** "Now or later on wifi": a gallery selection and/or camera videos already saved as `held`. */
interface WifiQuestion {
  selection: PreparedSelection | null;
  heldIds: string[];
  largestBytes: number;
}

export function MenuPage({ displayName, galleryUnlocked, onUploaded, onChoiceSaved }: MenuPageProps) {
  const { t } = useTranslation();
  const event = useEvent();
  const summary = useQueueSummary(event.eventId);
  const navigate = useNavigate();
  const photoInput = useRef<HTMLInputElement>(null);
  const videoInput = useRef<HTMLInputElement>(null);
  const galleryInput = useRef<HTMLInputElement>(null);
  // The camera mode last opened, so "Cuba lagi" on the help screen reopens the same one.
  const lastCamera = useRef(photoInput);
  const [snapOpen, setSnapOpen] = useState(false);
  const [showLockNotice, setShowLockNotice] = useState(false);
  const [notices, setNotices] = useState<string[]>([]);
  const [wifiQuestion, setWifiQuestion] = useState<WifiQuestion | null>(null);
  const [saving, setSaving] = useState(false);
  const [cameraCancelled, setCameraCancelled] = useState(false);
  const [cameraHelp, setCameraHelp] = useState(false);
  const [storageAcknowledged, setStorageAcknowledged] = useState(false);
  const [privacyChoice, setPrivacyChoice] = useState<PrivacyChoice | null>(() => readPrivacyChoice(event.eventId));
  const [privacyQuestion, setPrivacyQuestion] = useState<PrivacyQuestion | null>(null);

  // Until the first answer, captures are made as Peribadi and wait for the question.
  const context = { eventId: event.eventId, spaceId: event.spaceId, ...(privacyChoice ?? DEFAULT_CHOICE) };

  // Leaving the menu at the question: the waiting captures go as Peribadi, and the
  // question is asked again next time (no choice is saved). A held video stays
  // held; the queue bar offers "Hantar sekarang".
  const waitingCaptures = useRef<string[]>([]);
  waitingCaptures.current = privacyQuestion?.cameraIds ?? [];
  useEffect(
    () => () => {
      const ids = waitingCaptures.current;
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

  // The camera closed without a capture: maybe the guest changed their mind,
  // maybe the browser blocks it. Offer help without getting in the way (C6).
  useEffect(() => {
    const inputs = [photoInput.current, videoInput.current];
    const cancelled = () => setCameraCancelled(true);
    for (const input of inputs) input?.addEventListener('cancel', cancelled);
    return () => {
      for (const input of inputs) input?.removeEventListener('cancel', cancelled);
    };
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
        const capture = await m.takeFromCamera(first, context, awaitChoice);
        setNotices([
          ...(capture.mediaId ? [t('capture.saved')] : []),
          ...(capture.unsupported ? [t('capture.unsupported', { count: 1 })] : []),
          ...(capture.tooLarge ? [t('capture.tooLarge', { count: 1 })] : []),
          ...(capture.quotaFallback ? [t('capture.storageFull')] : []),
        ]);
        const mediaId = capture.mediaId;
        if (!mediaId) return;
        if (awaitChoice) {
          setPrivacyQuestion((question) => ({
            cameraIds: [...(question?.cameraIds ?? []), mediaId],
            heldIds: [...(question?.heldIds ?? []), ...(capture.held ? [mediaId] : [])],
            heldBytes: Math.max(question?.heldBytes ?? 0, capture.held ? first.size : 0),
            selection: question?.selection ?? null,
          }));
        } else if (capture.held) {
          setWifiQuestion({ selection: null, heldIds: [mediaId], largestBytes: first.size });
        }
        return;
      }
      const selection = await m.pickFromGallery(files, context);
      // Privacy first, then (for big files) the wifi question: one question per screen.
      if (privacyChoice === null) setPrivacyQuestion({ cameraIds: [], heldIds: [], heldBytes: 0, selection });
      else if (m.needsWifiQuestion(selection)) setWifiQuestion({ selection, heldIds: [], largestBytes: selection.largestBytes });
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
    await m.choosePrivacy(question.cameraIds, choice);
    const selection = question.selection ? m.withChoice(question.selection, choice) : null;
    const largeSelection = selection !== null && m.needsWifiQuestion(selection);
    if (largeSelection || question.heldIds.length > 0) {
      setWifiQuestion({
        selection,
        heldIds: question.heldIds,
        largestBytes: Math.max(question.heldBytes, largeSelection ? selection.largestBytes : 0),
      });
    } else if (selection) {
      await finish(selection, false);
    }
  }

  function answerWifi(question: WifiQuestion, later: boolean) {
    setWifiQuestion(null);
    if (question.selection) void finish(question.selection, later);
    // Camera videos were saved as held: "now" releases only these.
    if (!later && question.heldIds.length > 0) void actions().then((m) => m.sendHeld(event.eventId, question.heldIds));
  }

  // Always mounted, so "Cuba lagi" on a help screen can open the camera from its own tap.
  // One input per camera mode (D-088): a combined accept opens photo mode only on Android.
  const pickers = (
    <>
      <input
        ref={photoInput}
        type="file"
        accept="image/*"
        capture="environment"
        hidden
        onChange={(e) => void handleFiles(e, 'snapshot')}
      />
      <input
        ref={videoInput}
        type="file"
        accept="video/*"
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
    snapshot: () => {
      setNotices([]);
      setSnapOpen(true);
    },
    galleryUpload: () => galleryInput.current?.click(),
  };
  const openCamera = (input: typeof photoInput) => {
    lastCamera.current = input;
    setCameraCancelled(false);
    input.current?.click();
  };

  const captureNotices = (
    <>
      {notices.map((notice) => (
        <p key={notice} role="status" className="text-caption">
          {notice}
        </p>
      ))}
      {cameraCancelled ? <Button onClick={() => setCameraHelp(true)}>{t('device.cameraNotOpened')}</Button> : null}
    </>
  );

  let content: ReactNode;
  if (cameraHelp) {
    content = (
      <CameraHelpPage
        onBack={() => setCameraHelp(false)}
        onRetry={() => {
          setCameraHelp(false);
          lastCamera.current.current?.click();
        }}
        onContinue={() => {
          setCameraHelp(false);
          setCameraCancelled(false);
          setSnapOpen(false);
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
        cameraVideo={wifiQuestion.selection === null}
        onNow={() => answerWifi(wifiQuestion, false)}
        onLater={() => answerWifi(wifiQuestion, true)}
      />
    );
  } else if (snapOpen) {
    // Stays open after a capture, so the next photo or video is one tap away.
    content = (
      <SnapScreen
        eyebrow={event.displayNames}
        onPhoto={() => openCamera(photoInput)}
        onVideo={() => openCamera(videoInput)}
        onBack={() => {
          setSnapOpen(false);
          setCameraCancelled(false);
        }}
        mineCount={itemCount}
        onMine={() => navigate('mine')}
      >
        {captureNotices}
      </SnapScreen>
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
        {captureNotices}
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
