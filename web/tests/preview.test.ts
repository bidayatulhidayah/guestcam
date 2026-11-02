import { describe, expect, it } from 'vitest';
import { makePreview, type PreviewMakers } from '../src/lib/media/preview';

const jpeg = (label: string) => new Blob([label], { type: 'image/jpeg' });
const file = new Blob([new Uint8Array(8)]);

function makers(overrides: Partial<PreviewMakers>): PreviewMakers {
  return {
    photo: async () => jpeg('worker'),
    photoOnPage: async () => jpeg('page'),
    video: async () => ({ blob: jpeg('frame'), durationMs: 12_000 }),
    ...overrides,
  };
}

describe('My Uploads preview making', () => {
  it('a photo is made in the worker; the page tries only when the worker cannot decode it (HEIC)', async () => {
    expect(await (await makePreview(file, 'image', makers({}))).blob?.text()).toBe('worker');
    expect(await (await makePreview(file, 'image', makers({ photo: async () => null }))).blob?.text()).toBe('page');
  });

  it('a photo nobody can decode gets the placeholder, never an error', async () => {
    const failing = makers({ photo: async () => null, photoOnPage: async () => Promise.reject(new Error('decode')) });
    expect(await makePreview(file, 'image', failing)).toEqual({ blob: null, durationMs: null });
  });

  it('a video gets one frame and its length, or the placeholder when the frame cannot be read', async () => {
    const preview = await makePreview(file, 'video', makers({}));
    expect(await preview.blob?.text()).toBe('frame');
    expect(preview.durationMs).toBe(12_000);
    expect((await makePreview(file, 'video', makers({ video: async () => ({ blob: null, durationMs: null }) }))).blob).toBeNull();
    expect(await makePreview(file, 'video', makers({ video: () => Promise.reject(new Error('codec')) }))).toEqual({
      blob: null,
      durationMs: null,
    });
  });
});
