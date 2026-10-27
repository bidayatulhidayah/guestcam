import type { CaptureFeatureKey, FeatureKey } from '@guestcam/shared';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Icon, Screen, Tile, type IconName } from '../../components/ui';
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

/** Functions built so far. Phase 1b adds snapshot and galleryUpload. */
const READY: ReadonlySet<FeatureKey> = new Set<FeatureKey>([]);

export function MenuPage({ displayName, galleryUnlocked }: { displayName: string; galleryUnlocked: boolean }) {
  const { t } = useTranslation();
  const event = useEvent();
  const [showLockNotice, setShowLockNotice] = useState(false);

  const tiles = CAPTURE_TILES.filter((tile) => event.features.includes(tile.feature));
  const hasGallery = event.features.includes('publicGallery');

  return (
    <Screen>
      <CoupleHeader event={event} />
      <p className="-mt-4 mb-2 font-bold">{t('menu.greeting', { name: displayName })}</p>

      <nav aria-label={event.displayNames} className="grid grid-cols-2 gap-4">
        {tiles.map((tile, index) => {
          const ready = READY.has(tile.feature);
          return (
            <Tile
              key={tile.feature}
              icon={<Icon name={tile.icon} />}
              label={t(`menu.${tile.feature}`)}
              disabled={!ready}
              {...(!ready ? { note: t('menu.comingSoon') } : {})}
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
    </Screen>
  );
}
