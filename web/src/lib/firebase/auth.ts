import { connectAuthEmulator, getAuth, signInAnonymously, type Auth, type User } from 'firebase/auth';
import { EMULATOR_PORTS, USE_EMULATORS, emulatorUrl, getFirebaseApp } from './app';

let auth: Auth | undefined;

export function getFirebaseAuth(): Auth {
  if (!auth) {
    auth = getAuth(getFirebaseApp());
    if (USE_EMULATORS) connectAuthEmulator(auth, emulatorUrl(EMULATOR_PORTS.auth), { disableWarnings: true });
  }
  return auth;
}

let pendingUser: Promise<User> | undefined;

/**
 * Guests use Anonymous Auth: no account, no sign-up screen. Concurrent calls
 * share one sign-in, so a guest never gets two anonymous accounts.
 */
export function ensureAnonymousUser(): Promise<User> {
  pendingUser ??= (async () => {
    const current = getFirebaseAuth();
    await current.authStateReady();
    if (current.currentUser) return current.currentUser;
    const credential = await signInAnonymously(current);
    return credential.user;
  })().catch((error: unknown) => {
    pendingUser = undefined;
    throw error;
  });
  return pendingUser;
}
