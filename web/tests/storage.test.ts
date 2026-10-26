import { describe, expect, it } from 'vitest';
import { storage } from '../src/lib/storage';

describe('storage adapter (Phase 0 stub)', () => {
  it('exposes the five operations and rejects as not implemented', async () => {
    await expect(storage.uploadFile('p', new Blob(['x']), { contentType: 'text/plain' })).rejects.toThrow(
      /not implemented/,
    );
    await expect(storage.getDisplayUrl('p')).rejects.toThrow(/not implemented/);
    await expect(storage.getThumbUrl('p')).rejects.toThrow(/not implemented/);
    await expect(storage.getDownloadUrl('p')).rejects.toThrow(/not implemented/);
    await expect(storage.deleteFile('p')).rejects.toThrow(/not implemented/);
  });
});
