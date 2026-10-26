/**
 * App settings. The domain and owner come from env settings, never from code
 * (AGENTS.md, Domain). The product name lives in `brand.ts`.
 */
export { APP_NAME, APP_SHORT_NAME } from './brand';

/** "0.1" (A.B) from package.json, and the short commit hash of the build. */
export const APP_VERSION = __APP_VERSION__;
export const APP_COMMIT = __APP_COMMIT__;

/** Owner line of the copyright footer (per event later; this is the default). */
export const COPYRIGHT_OWNER = import.meta.env.VITE_COPYRIGHT_OWNER?.trim() || 'Hidayah';

/** Connect to the local Firebase emulators (dev server only, unless forced). */
export const USE_EMULATORS = import.meta.env.DEV && import.meta.env.VITE_USE_EMULATORS !== 'false';

function stripTrailingSlashes(url: string): string {
  return url.replace(/\/+$/, '');
}

/**
 * Public base URL used for QR codes and share links, e.g. "https://<site>.web.app".
 * Falls back to the current origin when the setting is empty (local dev).
 */
export function getPublicBaseUrl(): string {
  const configured = import.meta.env.VITE_PUBLIC_BASE_URL?.trim();
  if (configured) return stripTrailingSlashes(configured);
  return typeof window === 'undefined' ? '' : window.location.origin;
}

/**
 * Builds an absolute public link from a relative path stored in Firestore
 * (`/s/7k3qmxa/tunang`). Firestore never stores full URLs (D-038).
 */
export function buildPublicUrl(path: string, baseUrl: string = getPublicBaseUrl()): string {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${stripTrailingSlashes(baseUrl)}${cleanPath}`;
}
