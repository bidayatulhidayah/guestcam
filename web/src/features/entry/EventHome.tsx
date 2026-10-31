import type { Language } from '@guestcam/shared';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MenuPage } from '../menu/MenuPage';
import { SelfiePage } from '../onboarding/SelfiePage';
import { WelcomePage } from '../onboarding/WelcomePage';
import { readProfile, saveProfile, saveSelfie, type SpaceProfile } from '../onboarding/profileStore';
import { useEvent } from './EventContext';
import { readGalleryUnlocked, saveGalleryUnlocked } from './eventStore';

type Step = 'name' | 'selfie' | 'menu';

/**
 * Scan -> name -> selfie (skippable) -> menu (D-005). Name and selfie are
 * remembered per space, so the second event of the same couple goes straight
 * to the menu.
 */
export function EventHome() {
  const event = useEvent();
  const { i18n } = useTranslation();
  const [profile, setProfile] = useState<SpaceProfile | null>(() => readProfile(event.publicId));
  const [galleryUnlocked, setGalleryUnlocked] = useState(() => readGalleryUnlocked(event.eventId));
  const step: Step = !profile ? 'name' : !profile.selfieDecided ? 'selfie' : 'menu';

  const sync = useCallback(() => {
    import('../onboarding/guestSync')
      .then(({ syncGuest }) => syncGuest(event, (i18n.language === 'en' ? 'en' : 'ms') as Language))
      .then((status) => {
        if (!status) return;
        saveGalleryUnlocked(event.eventId, status.galleryUnlocked);
        setGalleryUnlocked(status.galleryUnlocked);
      })
      // Offline or a transient error: the profile stays on the phone and syncs next time.
      .catch(() => undefined);
  }, [event, i18n.language]);

  // The server unlocks the gallery a moment after the first upload lands (trigger).
  const onUploaded = useCallback(() => {
    setTimeout(sync, 2500);
    setTimeout(sync, 8000);
  }, [sync]);

  useEffect(() => {
    if (step === 'menu') sync();
  }, [step, sync]);

  function update(next: SpaceProfile) {
    saveProfile(event.publicId, next);
    setProfile(next);
  }

  if (step === 'name') {
    return (
      <WelcomePage event={event} onDone={(displayName) => update({ displayName, selfieDecided: false, hasSelfie: false })} />
    );
  }
  if (step === 'selfie' && profile) {
    return (
      <SelfiePage
        onDone={async (selfie) => {
          if (selfie) {
            try {
              await saveSelfie(event.publicId, selfie);
            } catch {
              // No IndexedDB (private mode): continue without a selfie rather than block the guest.
              selfie = null;
            }
          }
          update({ ...profile, selfieDecided: true, hasSelfie: selfie !== null });
        }}
      />
    );
  }
  return (
    <MenuPage
      displayName={profile?.displayName ?? ''}
      galleryUnlocked={galleryUnlocked}
      onUploaded={onUploaded}
      onChoiceSaved={sync}
    />
  );
}
