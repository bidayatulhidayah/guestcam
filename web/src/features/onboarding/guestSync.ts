/**
 * Puts this device's guest profile on the server for one event: the guest doc
 * and, if the guest took one, the selfie. Safe to call again and again; it is
 * called after onboarding and every time the menu opens, so a profile saved
 * offline reaches the server later. Loaded lazily (Firebase + Storage).
 */
import { firestorePaths, storagePaths, type EventView, type Guest, type Language } from '@guestcam/shared';
import { doc, getDoc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore/lite';
import { getDb } from '../../lib/firebase/firestore';
import { loadFirebase } from '../../lib/firebase/load';
import { storage } from '../../lib/storage';
import { readPrivacyChoice, savePrivacyChoice } from '../privacy/privacyChoice';
import { readProfile, readSelfie } from './profileStore';

export interface GuestStatus {
  galleryUnlocked: boolean;
}

export async function syncGuest(event: EventView, language: Language): Promise<GuestStatus | null> {
  const profile = readProfile(event.publicId);
  if (!profile) return null;

  const { ensureAnonymousUser } = await loadFirebase();
  const { uid } = await ensureAnonymousUser();
  const ref = doc(getDb(), firestorePaths.guest(event.eventId, uid));

  let snapshot = await getDoc(ref);
  if (!snapshot.exists()) {
    await setDoc(ref, {
      displayName: profile.displayName,
      selfiePath: null,
      selfieThumbPath: null,
      galleryUnlocked: false,
      firstUploadAt: null,
      lastVisibility: null,
      showName: true,
      language,
      joinedAt: serverTimestamp(),
    });
    snapshot = await getDoc(ref);
  }
  let guest = snapshot.data() as Guest;
  if (!guest.displayName) {
    // The upload trigger created a bare doc (gallery unlock) before the profile synced.
    await updateDoc(ref, {
      displayName: profile.displayName,
      selfiePath: null,
      lastVisibility: null,
      showName: true,
      language,
    });
    guest = (await getDoc(ref)).data() as Guest;
  }

  // The privacy answer lives on the phone and on the guest record (lastVisibility,
  // showName). Before the first answer lastVisibility stays null, so the question returns.
  const choice = readPrivacyChoice(event.eventId);
  if (choice && (guest.lastVisibility !== choice.visibility || guest.showName !== choice.showName)) {
    await updateDoc(ref, { lastVisibility: choice.visibility, showName: choice.showName });
  } else if (!choice && guest.lastVisibility) {
    savePrivacyChoice(event.eventId, { visibility: guest.lastVisibility, showName: guest.showName });
  }

  if (profile.hasSelfie && !guest.selfiePath) {
    const selfie = await readSelfie(event.publicId);
    if (selfie) {
      const path = storagePaths.guestSelfie(event.eventId, uid, 'jpg');
      await storage.uploadFile(path, selfie, { contentType: 'image/jpeg' });
      await updateDoc(ref, { selfiePath: path });
    }
  }
  return { galleryUnlocked: guest.galleryUnlocked === true };
}
