/**
 * Server-side storage adapter (AGENTS.md rule 9). Functions never import
 * Firebase Storage directly; a Cloudflare R2 implementation must drop in here.
 * Implemented in Phase 3 with media processing.
 */
export interface ServerStorageAdapter {
  readFile(path: string): Promise<Buffer>;
  writeFile(path: string, data: Buffer, contentType: string): Promise<void>;
  exists(path: string): Promise<boolean>;
  getDownloadUrl(path: string, expiresInMs: number): Promise<string>;
  deleteFile(path: string): Promise<void>;
}
