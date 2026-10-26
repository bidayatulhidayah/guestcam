/**
 * Characters used for event codes and permanent space ids.
 * Look-alikes are removed: no i, l, o, 0 or 1.
 */
export const CODE_ALPHABET = 'abcdefghjkmnpqrstuvwxyz23456789';

/** Event code: 4 characters from the code alphabet, lowercase. */
export const EVENT_CODE_PATTERN = /^[a-hj-km-np-z2-9]{4}$/;

/** Permanent space id (`/s/:publicId`): 7 characters from the code alphabet. */
export const PUBLIC_ID_PATTERN = /^[a-hj-km-np-z2-9]{7}$/;

/**
 * Names that can never be an alias or an event slug, because they are routes,
 * route segments or static files served by Hosting.
 */
export const RESERVED_NAMES: ReadonlySet<string> = new Set([
  // site routes
  's',
  'admin',
  'api',
  'login',
  'logout',
  'mine',
  'demo',
  'inactive',
  // route segments inside a space
  'gallery',
  'f',
  // static files and folders
  'assets',
  'fonts',
  'icons',
  'sw',
  'workbox',
  'registersw',
  'manifest',
  'favicon',
  'robots',
  'index',
  'offline',
]);

export function isReservedName(name: string): boolean {
  return RESERVED_NAMES.has(name.toLowerCase());
}
