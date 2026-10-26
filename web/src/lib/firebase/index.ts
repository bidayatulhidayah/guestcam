/**
 * Firebase entry point. Load it with a dynamic `import()` so the SDK stays out
 * of the first-load bundle (performance budget: guest JS < 150 KB gzipped).
 */
import { ensureAnonymousUser } from './auth';
import { getDb } from './firestore';
import { getFirebaseStorage } from './storage';

export { USE_EMULATORS } from './app';
export { ensureAnonymousUser, getFirebaseAuth } from './auth';
export { getDb } from './firestore';

/** Initialises Auth, Firestore and Storage (emulators in dev) and signs in anonymously. */
export async function connectFirebase(): Promise<{ uid: string }> {
  getDb();
  getFirebaseStorage();
  const user = await ensureAnonymousUser();
  return { uid: user.uid };
}
