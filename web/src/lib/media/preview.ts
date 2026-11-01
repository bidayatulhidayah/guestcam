import { makeThumbnail } from './thumbnail';
import { PREVIEW_MAX_SIDE } from './thumbnailTypes';
import { drawSmall, grabVideoFrame } from './videoFrame';

/**
 * Fallback when the worker cannot decode a photo (no OffscreenCanvas before
 * iOS 16.4; some HEIC). `img.decode()` decodes off the main thread; only the
 * small draw runs on it. Android Chrome cannot show HEIC at all: null.
 */
async function photoOnPage(file: Blob): Promise<Blob | null> {
  const url = URL.createObjectURL(file);
  try {
    const image = new Image();
    image.src = url;
    await image.decode();
    return await drawSmall(image, image.naturalWidth, image.naturalHeight, PREVIEW_MAX_SIDE);
  } catch {
    return null;
  } finally {
    URL.revokeObjectURL(url);
  }
}

export interface PreviewMakers {
  photo: (file: Blob) => Promise<Blob | null>;
  photoOnPage: (file: Blob) => Promise<Blob | null>;
  video: (file: Blob) => Promise<Blob | null>;
}

const BROWSER: PreviewMakers = { photo: makeThumbnail, photoOnPage, video: (file) => grabVideoFrame(file) };

/** One at a time: decoding a big photo or a video frame takes a lot of memory. */
let chain: Promise<unknown> = Promise.resolve();

/**
 * A ~400 px JPEG preview for My Uploads: a photo in the Web Worker (then on
 * the page if the worker cannot decode it), or one frame near the start of a
 * video. Null means the neutral placeholder; it never throws.
 */
export function makePreview(file: Blob, type: 'image' | 'video', makers: PreviewMakers = BROWSER): Promise<Blob | null> {
  const run = async () => {
    try {
      if (type === 'video') return await makers.video(file);
      return (await makers.photo(file)) ?? (await makers.photoOnPage(file));
    } catch {
      return null;
    }
  };
  const result = chain.then(run);
  chain = result;
  return result;
}
