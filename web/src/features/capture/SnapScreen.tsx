import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Icon, Screen } from '../../components/ui';

/**
 * Snap Gambar (D-088): one button per camera mode. A single input accepting
 * photos and videos opens photo mode only on Android and varies on iOS.
 * The buttons must call the pickers from the tap itself (pitfall C1).
 */
export function SnapScreen({
  eyebrow,
  onPhoto,
  onVideo,
  onBack,
  mineCount,
  onMine,
  children,
}: {
  eyebrow: string;
  onPhoto: () => void;
  onVideo: () => void;
  onBack: () => void;
  /** The guest's items on this phone, for the small "Muat Naik Saya (n)" link. */
  mineCount: number;
  onMine: () => void;
  /** Notices from the last capture, shown under the hint. */
  children?: ReactNode;
}) {
  const { t } = useTranslation();
  return (
    <Screen
      eyebrow={eyebrow}
      title={t('menu.snapshot')}
      back={onBack}
      bottom={
        <>
          <Button variant="primary" icon={<Icon name="camera" />} onClick={onPhoto}>
            {t('capture.snapPhoto')}
          </Button>
          <Button icon={<Icon name="video" />} onClick={onVideo}>
            {t('capture.snapVideo')}
          </Button>
          {/* Same small style as "Kembali" (D-086, D-089). */}
          {mineCount > 0 ? (
            <button
              type="button"
              onClick={onMine}
              className="-ml-2 inline-flex min-h-11 items-center gap-1 self-start px-2 text-caption text-ink-2 active:text-ink"
            >
              <span>{t('capture.snapMine', { count: mineCount })}</span>
              <Icon name="arrowRight" size={18} />
            </button>
          ) : null}
        </>
      }
    >
      <p>{t('capture.snapHint')}</p>
      {children}
    </Screen>
  );
}
