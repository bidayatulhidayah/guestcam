import { connectFirestoreEmulator, getFirestore, type Firestore } from 'firebase/firestore/lite';
import { EMULATOR_HOST, EMULATOR_PORTS, USE_EMULATORS, getFirebaseApp } from './app';

let db: Firestore | undefined;

/**
 * Firestore Lite (41 KB instead of 147 KB): one-off reads and writes only.
 * The live gallery (Phase 3) loads the full SDK in its own chunk.
 */
export function getDb(): Firestore {
  if (!db) {
    db = getFirestore(getFirebaseApp());
    if (USE_EMULATORS) connectFirestoreEmulator(db, EMULATOR_HOST, EMULATOR_PORTS.firestore);
  }
  return db;
}
