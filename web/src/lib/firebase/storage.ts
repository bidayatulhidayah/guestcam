import { connectStorageEmulator, getStorage, type FirebaseStorage } from 'firebase/storage';
import { EMULATOR_HOST, EMULATOR_PORTS, USE_EMULATORS, getFirebaseApp } from './app';

let storage: FirebaseStorage | undefined;

/** For the storage adapter (`lib/storage`) ONLY; screens never import this. */
export function getFirebaseStorage(): FirebaseStorage {
  if (!storage) {
    storage = getStorage(getFirebaseApp());
    if (USE_EMULATORS) connectStorageEmulator(storage, EMULATOR_HOST, EMULATOR_PORTS.storage);
  }
  return storage;
}
