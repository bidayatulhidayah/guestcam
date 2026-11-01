import { getDownloadURL, getMetadata, ref, uploadBytesResumable } from 'firebase/storage';
import { getFirebaseStorage } from '../firebase/storage';
import type { StorageAdapter, UploadOptions } from './types';

function notImplemented(method: keyof StorageAdapter): Promise<never> {
  return Promise.reject(new Error(`Storage adapter: ${method} is not implemented yet (Phase 3)`));
}

function uploadFile(path: string, data: Blob, options: UploadOptions): Promise<void> {
  const task = uploadBytesResumable(ref(getFirebaseStorage(), path), data, {
    contentType: options.contentType,
    ...(options.customMetadata ? { customMetadata: options.customMetadata } : {}),
  });
  if (options.signal?.aborted) task.cancel();
  options.signal?.addEventListener('abort', () => task.cancel(), { once: true });

  return new Promise((resolve, reject) => {
    task.on(
      'state_changed',
      (snapshot) => options.onProgress?.({ bytesTransferred: snapshot.bytesTransferred, totalBytes: snapshot.totalBytes }),
      reject,
      () => resolve(),
    );
  });
}

async function fileExists(path: string): Promise<boolean> {
  try {
    await getMetadata(ref(getFirebaseStorage(), path));
    return true;
  } catch (error) {
    if ((error as { code?: string }).code === 'storage/object-not-found') return false;
    throw error;
  }
}

/** Readable only by its owner and the space owners (storage.rules); the browser streams it. */
function getDownloadUrl(path: string): Promise<string> {
  return getDownloadURL(ref(getFirebaseStorage(), path));
}

/** Firebase Storage implementation (rule 9). Display and thumbnail URLs arrive in Phase 3. */
export const firebaseStorageAdapter: StorageAdapter = {
  uploadFile,
  fileExists,
  getDisplayUrl: () => notImplemented('getDisplayUrl'),
  getThumbUrl: () => notImplemented('getThumbUrl'),
  getDownloadUrl,
  deleteFile: () => notImplemented('deleteFile'),
};
