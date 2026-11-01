import { describe, expect, it } from 'vitest';
import { makePreview, type PreviewMakers } from '../src/lib/media/preview';

const jpeg = (label: string) => new Blob([label], { type: 'image/jpeg' });
const file = new Blob([new Uint8Array(8)]);

function makers(overrides: Partial<PreviewMakers>): PreviewMakers {
  return {
    photo: async () => jpeg('worker'),
    photoOnPage: async () => jpeg('page'),
    video: async () => jpeg('frame'),
    ...overrides,
  };
}

describe('My Uploads preview making', () => {
  it('a photo is made in the worker; the page tries only when the worker cannot decode it (HEIC)', async () => {
    expect(await (await makePreview(file, 'image', makers({})))?.text()).toBe('worker');
    expect(await (await makePreview(file, 'image', makers({ photo: async () => null })))?.text()).toBe('page');
  });

  it('a photo nobody can decode gets the placeholder, never an error', async () => {
    const failing = makers({ photo: async () => null, photoOnPage: async () => Promise.reject(new Error('decode')) });
    expect(await makePreview(file, 'image', failing)).toBeNull();
  });

  it('a video gets one frame, or the placeholder when the frame cannot be read', async () => {
    expect(await (await makePreview(file, 'video', makers({})))?.text()).toBe('frame');
    expect(await makePreview(file, 'video', makers({ video: async () => null }))).toBeNull();
    expect(await makePreview(file, 'video', makers({ video: () => Promise.reject(new Error('codec')) }))).toBeNull();
  });
});
