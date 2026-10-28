import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

/** One Admin SDK app for all functions. In the emulator it connects automatically. */
const app = initializeApp();

export const db = getFirestore(app);
