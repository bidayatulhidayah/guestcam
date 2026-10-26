import { connectFirestoreEmulator, getFirestore, type Firestore } from 'firebase/firestore';
import { EMULATOR_HOST, EMULATOR_PORTS, USE_EMULATORS, getFirebaseApp } from './app';

let db: Firestore | undefined;

export function getDb(): Firestore {
  if (!db) {
    db = getFirestore(getFirebaseApp());
    if (USE_EMULATORS) connectFirestoreEmulator(db, EMULATOR_HOST, EMULATOR_PORTS.firestore);
  }
  return db;
}
