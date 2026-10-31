/**
 * In-app browsers (pitfall I1): links opened inside Instagram, Facebook,
 * Messenger, TikTok or LINE often block the camera on iPhone, and their
 * storage is separate from Safari/Chrome, so My Uploads would be lost later.
 * Detection is by user agent and best effort: WhatsApp on iPhone, for one,
 * cannot be told apart from Safari.
 */
export type InAppApp = 'instagram' | 'facebook' | 'messenger' | 'tiktok' | 'line';
export type Platform = 'android' | 'ios' | 'other';

export interface InAppBrowser {
  app: InAppApp;
  platform: Platform;
}

// Messenger before Facebook: Messenger's in-app browser also carries FBAN/FB_IAB.
const APPS: [InAppApp, RegExp][] = [
  ['instagram', /\bInstagram\b/i],
  ['messenger', /FBAN\/Messenger|FB_IAB\/MESSENGER|\bMessenger(ForiOS|LiteForiOS)?\b/i],
  ['facebook', /\bFBAN\/|\bFBAV\/|\bFB_IAB\/|\bFB4A\b|\bFBIOS\b/i],
  ['tiktok', /musical_ly|BytedanceWebview|\bTikTok\b/i],
  ['line', /\bLine\/\d/i],
];

export function platformOf(userAgent: string): Platform {
  if (/Android/i.test(userAgent)) return 'android';
  if (/iPhone|iPad|iPod/i.test(userAgent)) return 'ios';
  return 'other';
}

export function detectInAppBrowser(userAgent: string): InAppBrowser | null {
  const match = APPS.find(([, pattern]) => pattern.test(userAgent));
  return match ? { app: match[0], platform: platformOf(userAgent) } : null;
}

/** Android: a link that opens the same address in Chrome (falls back to the page itself). */
export function chromeIntentUrl(location: Pick<Location, 'host' | 'pathname' | 'search' | 'href'>): string {
  const fallback = encodeURIComponent(location.href);
  return `intent://${location.host}${location.pathname}${location.search}#Intent;scheme=https;package=com.android.chrome;S.browser_fallback_url=${fallback};end`;
}
