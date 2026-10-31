/**
 * A simulated phone for end-to-end tests through the emulators: its own app,
 * anonymous user, callables, Firestore and Storage, exactly like the web app.
 */
import {
  CALLABLES,
  type JoinEventRequest,
  type JoinEventResponse,
  type ResolveCurrentEventRequest,
  type ResolveCurrentEventResponse,
} from '@guestcam/shared';
import { deleteApp, initializeApp, type FirebaseApp } from 'firebase/app';
import { connectAuthEmulator, getAuth, signInAnonymously } from 'firebase/auth';
import { connectFirestoreEmulator, getFirestore } from 'firebase/firestore';
import { connectFunctionsEmulator, getFunctions, httpsCallable } from 'firebase/functions';
import { connectStorageEmulator, getStorage } from 'firebase/storage';
import { PROJECT_ID } from './setup';

const apps: FirebaseApp[] = [];

/** Call in afterEach. */
export async function closeGuests(): Promise<void> {
  await Promise.all(apps.splice(0).map((app) => deleteApp(app)));
}

export async function newGuest() {
  const app = initializeApp(
    { projectId: PROJECT_ID, apiKey: 'demo-api-key', storageBucket: `${PROJECT_ID}.appspot.com` },
    `guest-${Math.random()}`,
  );
  apps.push(app);
  const auth = getAuth(app);
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
  const { user } = await signInAnonymously(auth);
  const functions = getFunctions(app, 'asia-southeast1');
  connectFunctionsEmulator(functions, '127.0.0.1', 5001);
  const db = getFirestore(app);
  connectFirestoreEmulator(db, '127.0.0.1', 8080);
  const storage = getStorage(app);
  connectStorageEmulator(storage, '127.0.0.1', 9199);

  const join = httpsCallable<JoinEventRequest, JoinEventResponse>(functions, CALLABLES.joinEvent);
  const resolve = httpsCallable<ResolveCurrentEventRequest, ResolveCurrentEventResponse>(
    functions,
    CALLABLES.resolveCurrentEvent,
  );
  return {
    uid: user.uid,
    db,
    storage,
    join: async (data: JoinEventRequest) => (await join(data)).data,
    resolve: async (data: ResolveCurrentEventRequest) => (await resolve(data)).data,
  };
}

/** Polls until `check` returns a value (not undefined), or fails after `timeoutMs`. */
export async function eventually<T>(check: () => Promise<T | undefined>, timeoutMs = 20_000): Promise<T> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const value = await check();
    if (value !== undefined) return value;
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`Condition not met within ${timeoutMs} ms`);
}
