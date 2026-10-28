/**
 * Minimal IndexedDB key -> Blob store for small device-only files (the
 * selfie). The upload queue (Phase 1b) has its own Dexie database.
 */
const DB_NAME = 'guestcam-blobs';
const STORE = 'blobs';

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('IndexedDB open failed'));
  });
}

async function run<T>(mode: IDBTransactionMode, action: (store: IDBObjectStore) => IDBRequest): Promise<T> {
  const db = await openDb();
  try {
    return await new Promise<T>((resolve, reject) => {
      const request = action(db.transaction(STORE, mode).objectStore(STORE));
      request.onsuccess = () => resolve(request.result as T);
      request.onerror = () => reject(request.error ?? new Error('IndexedDB request failed'));
    });
  } finally {
    db.close();
  }
}

export async function putBlob(key: string, blob: Blob): Promise<void> {
  await run<IDBValidKey>('readwrite', (store) => store.put(blob, key));
}

export async function getBlob(key: string): Promise<Blob | null> {
  try {
    return (await run<Blob | undefined>('readonly', (store) => store.get(key))) ?? null;
  } catch {
    return null;
  }
}
