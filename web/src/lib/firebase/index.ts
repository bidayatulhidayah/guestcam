/**
 * Firebase core for the first screens: app, Anonymous Auth and callables
 * (~37 KB gzipped). Loaded through `loadFirebase()` in parallel with the
 * first screen. Firestore Lite (`./firestore`) and Storage are imported only
 * by the lazy modules that need them, so they stay out of this chunk.
 */
export { USE_EMULATORS } from './app';
export { ensureAnonymousUser, getFirebaseAuth } from './auth';
export { callFunction } from './functions';
