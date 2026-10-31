/// <reference lib="webworker" />
/**
 * Makes a small preview of a photo off the main thread (performance budget),
 * for My Uploads until server thumbnails arrive (Phase 3). Browsers that
 * cannot decode the photo here (e.g. HEIC on Android) answer null.
 */
import type { ThumbnailRequest, ThumbnailResponse } from './thumbnailTypes';

const MAX_SIDE = 320;

self.onmessage = async (event: MessageEvent<ThumbnailRequest>) => {
  const { id, file } = event.data;
  let blob: Blob | null = null;
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = new OffscreenCanvas(width, height);
    canvas.getContext('2d')?.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();
    blob = await canvas.convertToBlob({ type: 'image/jpeg', quality: 0.7 });
  } catch {
    blob = null;
  }
  self.postMessage({ id, blob } satisfies ThumbnailResponse);
};
