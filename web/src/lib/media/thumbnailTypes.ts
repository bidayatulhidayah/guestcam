export interface ThumbnailRequest {
  id: number;
  file: Blob;
}

export interface ThumbnailResponse {
  id: number;
  /** A small JPEG, or null when this browser cannot decode the photo. */
  blob: Blob | null;
}
