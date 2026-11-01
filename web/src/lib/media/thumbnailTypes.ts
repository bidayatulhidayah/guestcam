/** Longest side of a My Uploads preview, in pixels. */
export const PREVIEW_MAX_SIDE = 400;

export interface ThumbnailRequest {
  id: number;
  file: Blob;
}

export interface ThumbnailResponse {
  id: number;
  /** A small JPEG, or null when this browser cannot decode the photo. */
  blob: Blob | null;
}
