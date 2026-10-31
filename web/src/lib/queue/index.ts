/**
 * The app's single upload queue. Loaded lazily (Dexie, Firestore Lite and
 * Storage), first when the menu opens, so it never weighs on the first screen.
 */
import { setReloadGuard } from '../device/serviceWorker';
import { QueueDb } from './db';
import { firebaseRemote } from './firebaseRemote';
import { UploadQueue } from './runner';

export {
  describeCapture,
  prepareCapture,
  readCaptureDetails,
  type CaptureContext,
  type PreparedCapture,
} from './capture';
export type { AddResult } from './runner';
export type { QueueItem } from './types';
export { QueueDb } from './db';

let queue: Promise<UploadQueue> | undefined;
let db: QueueDb | undefined;

export function getQueueDb(): QueueDb {
  db ??= new QueueDb();
  return db;
}

/** Starts the queue once per page: resumes anything left from before a reload. */
export function getQueue(): Promise<UploadQueue> {
  queue ??= (async () => {
    const instance = new UploadQueue({ db: getQueueDb(), remote: firebaseRemote, isOnline: () => navigator.onLine });
    // An app update must not reload away a gallery pick before it is sent (pitfall U5).
    setReloadGuard(() => instance.canReloadSafely());
    window.addEventListener('online', () => instance.kick());
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') instance.kick();
    });
    await instance.start();
    return instance;
  })();
  return queue;
}

/** Asks the browser not to clear queued captures under storage pressure (performance budget). */
export async function requestPersistentStorage(): Promise<void> {
  try {
    if (navigator.storage?.persisted && !(await navigator.storage.persisted())) await navigator.storage.persist();
  } catch {
    // Not supported: the queue still works, with a smaller safety margin.
  }
}
