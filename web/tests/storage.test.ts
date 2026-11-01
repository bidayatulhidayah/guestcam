import { describe, expect, it } from 'vitest';
import { storage } from '../src/lib/storage';

describe('storage adapter', () => {
  it('exposes the rule 9 operations plus fileExists', () => {
    for (const method of ['uploadFile', 'fileExists', 'getDisplayUrl', 'getThumbUrl', 'getDownloadUrl', 'deleteFile']) {
      expect(typeof storage[method as keyof typeof storage]).toBe('function');
    }
  });

  // getDownloadUrl is in use since D-091 (a guest plays their own video in My Uploads).
  it('gallery URLs and deletes are not implemented until Phase 3', async () => {
    await expect(storage.getDisplayUrl('p')).rejects.toThrow(/not implemented/);
    await expect(storage.getThumbUrl('p')).rejects.toThrow(/not implemented/);
    await expect(storage.deleteFile('p')).rejects.toThrow(/not implemented/);
  });
});
