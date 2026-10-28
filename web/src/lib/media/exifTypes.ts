export interface ExifRequest {
  id: number;
  file: Blob;
}

export interface ExifResponse {
  id: number;
  /** Whitelisted EXIF fields only (pitfall M7). */
  exif: Record<string, string | number | boolean | null>;
  latitude: number | null;
  longitude: number | null;
}
