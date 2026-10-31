/**
 * Server-side storage adapter (AGENTS.md rule 9). Functions never import
 * Firebase Storage directly; a Cloudflare R2 implementation must drop in here.
 */
import { getStorage } from 'firebase-admin/storage';

export interface ServerStorageAdapter {
  readFile(path: string): Promise<Buffer>;
  writeFile(path: string, data: Buffer, contentType: string): Promise<void>;
  exists(path: string): Promise<boolean>;
  getDownloadUrl(path: string, expiresInMs: number): Promise<string>;
  /** Deletes one file; a missing file is not an error (triggers retry). */
  deleteFile(path: string): Promise<void>;
  /** Deletes every file whose path starts with the prefix. */
  deletePrefix(prefix: string): Promise<void>;
}

const bucket = () => getStorage().bucket();

export const storage: ServerStorageAdapter = {
  async readFile(path) {
    const [data] = await bucket().file(path).download();
    return data;
  },
  async writeFile(path, data, contentType) {
    // Immutable names (one per mediaId and variant), so long cache headers are safe.
    await bucket().file(path).save(data, { contentType, metadata: { cacheControl: 'public, max-age=31536000, immutable' } });
  },
  async exists(path) {
    const [found] = await bucket().file(path).exists();
    return found;
  },
  async getDownloadUrl(path, expiresInMs) {
    const [url] = await bucket()
      .file(path)
      .getSignedUrl({ action: 'read', expires: Date.now() + expiresInMs });
    return url;
  },
  async deleteFile(path) {
    await bucket().file(path).delete({ ignoreNotFound: true });
  },
  async deletePrefix(prefix) {
    await bucket().deleteFiles({ prefix, force: true });
  },
};
