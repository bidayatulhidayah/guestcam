import { firebaseStorageAdapter } from './firebaseStorage';
import type { StorageAdapter } from './types';

export type { StorageAdapter, UploadOptions, UploadProgress } from './types';

/** The active adapter. Swap the implementation here for R2. */
export const storage: StorageAdapter = firebaseStorageAdapter;
