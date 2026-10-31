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
let db: Promise<QueueDb> | undefined;
let memoryOnly = false;

/**
 * The queue's database. If the phone refuses IndexedDB (site data blocked),
 * an in-memory copy keeps the app working until the page closes (pitfall C6);
 * the menu then asks the guest to keep the page open.
 */
export function getQueueDb(): Promise<QueueDb> {
  db ??= (async () => {
    const stored = new QueueDb();
    try {
      await stored.open();
      return stored;
    } catch {
      memoryOnly = true;
      const { indexedDB, IDBKeyRange } = await import('fake-indexeddb');
      const memory = new QueueDb('guestcam-queue', { indexedDB, IDBKeyRange });
      await memory.open();
      return memory;
    }
  })();
  return db;
}

/** True when captures live only in this page's memory (see `getQueueDb`). */
export function isMemoryOnly(): boolean {
  return memoryOnly;
}

/** Starts the queue once per page: resumes anything left from before a reload. */
export function getQueue(): Promise<UploadQueue> {
  queue ??= (async () => {
    const instance = new UploadQueue({ db: await getQueueDb(), remote: firebaseRemote, isOnline: () => navigator.onLine });
    // An app update must not reload away a gallery pick before it is sent (pitfall U5),
    // nor anything at all while the database lives only in memory.
    setReloadGuard(() => instance.canReloadSafely() && !(memoryOnly && instance.hasUnsent()));
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
