import type { StorageAdapter } from './types';

function notImplemented(method: keyof StorageAdapter): Promise<never> {
  return Promise.reject(new Error(`Storage adapter: ${method} is not implemented yet (Phase 1)`));
}

/** Firebase Storage implementation. Phase 0 stub: every call rejects. */
export const firebaseStorageAdapter: StorageAdapter = {
  uploadFile: () => notImplemented('uploadFile'),
  getDisplayUrl: () => notImplemented('getDisplayUrl'),
  getThumbUrl: () => notImplemented('getThumbUrl'),
  getDownloadUrl: () => notImplemented('getDownloadUrl'),
  deleteFile: () => notImplemented('deleteFile'),
};
