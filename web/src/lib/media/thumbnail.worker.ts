/// <reference lib="webworker" />
/**
 * Makes a small preview of a photo off the main thread (performance budget),
 * for My Uploads until server thumbnails arrive (Phase 3). Browsers that
 * cannot decode the photo here answer null (HEIC on Android; no OffscreenCanvas
 * before iOS 16.4), and `preview.ts` tries once more on the page.
 */
import { PREVIEW_MAX_SIDE as MAX_SIDE, type ThumbnailRequest, type ThumbnailResponse } from './thumbnailTypes';

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
