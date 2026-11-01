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
  children,
}: {
  eyebrow: string;
  onPhoto: () => void;
  onVideo: () => void;
  onBack: () => void;
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
        </>
      }
    >
      <p>{t('capture.snapHint')}</p>
      {children}
    </Screen>
  );
}
