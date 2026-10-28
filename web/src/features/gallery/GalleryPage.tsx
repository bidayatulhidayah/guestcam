import { useTranslation } from 'react-i18next';
import { Screen } from '../../components/ui';
import { useEvent } from '../entry/EventContext';
import { readGalleryUnlocked } from '../entry/eventStore';

/**
 * `.../:eventSlug/gallery`. Locked until the guest's first upload; the real
 * gallery (and its lock in security rules, pitfall P3) arrives in Phase 3.
 */
export function GalleryPage() {
  const { t } = useTranslation();
  const event = useEvent();
  const unlocked = readGalleryUnlocked(event.eventId);
  return (
    <Screen title={t('gallery.title')}>
      <p>{unlocked ? t('gallery.soon') : t('menu.galleryLockedNotice')}</p>
    </Screen>
  );
}
