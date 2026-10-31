/// <reference lib="webworker" />
/**
 * Reads EXIF off the main thread (performance budget). exifr reads only the
 * header chunks it needs, never the whole file. Only whitelisted fields are
 * returned (pitfall M7); GPS becomes the host-only location.
 */
import { EXIF_WHITELIST } from '@guestcam/shared';
import exifr from 'exifr';
import type { ExifRequest, ExifResponse } from './exifTypes';

self.onmessage = async (event: MessageEvent<ExifRequest>) => {
  const { id, file } = event.data;
  const response: ExifResponse = { id, exif: {}, latitude: null, longitude: null };
  try {
    const tags = (await exifr.parse(file, {
      tiff: true,
      exif: true,
      gps: true,
      ifd1: false,
      xmp: false,
      icc: false,
      iptc: false,
      jfif: false,
      ihdr: false,
      reviveValues: false,
      translateValues: false,
    })) as Record<string, unknown> | undefined;
    if (tags) {
      for (const key of EXIF_WHITELIST) {
        const value = tags[key];
        if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
          response.exif[key] = typeof value === 'string' ? value.slice(0, 200) : value;
        }
      }
      const { latitude, longitude } = tags as { latitude?: unknown; longitude?: unknown };
      if (typeof latitude === 'number' && typeof longitude === 'number' && Number.isFinite(latitude)) {
        response.latitude = latitude;
        response.longitude = longitude;
      }
    }
  } catch {
    // No or broken EXIF: send the item without metadata rather than block it.
  }
  (self as unknown as DedicatedWorkerGlobalScope).postMessage(response);
};
