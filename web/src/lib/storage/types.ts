/**
 * Storage adapter (AGENTS.md rule 9). Screens and the upload queue use ONLY
 * this interface, never Firebase Storage directly, so a Cloudflare R2
 * implementation (signed multipart uploads) can drop in later.
 * Paths come from `storagePaths` in @guestcam/shared.
 */
export interface UploadProgress {
  bytesTransferred: number;
  totalBytes: number;
}

export interface UploadOptions {
  contentType: string;
  customMetadata?: Record<string, string>;
  onProgress?: (progress: UploadProgress) => void;
  /** Aborts the upload; the queue retries it later. */
  signal?: AbortSignal;
}

export interface StorageAdapter {
  /** Resumable upload of an original file. */
  uploadFile(path: string, data: Blob, options: UploadOptions): Promise<void>;
  /** Display copy (~1600 px WebP or 720p MP4) for viewing. */
  getDisplayUrl(path: string): Promise<string>;
  /** ~400 px WebP thumbnail for the gallery grid. */
  getThumbUrl(path: string): Promise<string>;
  /** Original file, only on explicit download (rule 6). */
  getDownloadUrl(path: string): Promise<string>;
  deleteFile(path: string): Promise<void>;
}
