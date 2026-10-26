import { initializeApp, type FirebaseApp, type FirebaseOptions } from 'firebase/app';
import { USE_EMULATORS } from '../../config';

/** Emulators run as a demo project, so they can never touch real data. */
export const EMULATOR_PROJECT_ID = 'demo-guestcam';
const EMULATOR_HOST = '127.0.0.1';

export const EMULATOR_PORTS = { auth: 9099, firestore: 8080, storage: 9199, functions: 5001 } as const;

function firebaseOptions(): FirebaseOptions {
  if (USE_EMULATORS) {
    return {
      apiKey: 'demo-api-key',
      authDomain: `${EMULATOR_PROJECT_ID}.firebaseapp.com`,
      projectId: EMULATOR_PROJECT_ID,
      storageBucket: `${EMULATOR_PROJECT_ID}.appspot.com`,
      appId: 'demo-app-id',
    };
  }
  const env = import.meta.env;
  return {
    apiKey: env.VITE_FIREBASE_API_KEY,
    authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: env.VITE_FIREBASE_APP_ID,
  };
}

let app: FirebaseApp | undefined;

export function getFirebaseApp(): FirebaseApp {
  app ??= initializeApp(firebaseOptions());
  return app;
}

export function emulatorUrl(port: number): string {
  return `http://${EMULATOR_HOST}:${port}`;
}

export { EMULATOR_HOST, USE_EMULATORS };
