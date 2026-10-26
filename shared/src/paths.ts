/**
 * Firestore and Storage path builders: the single source for every path,
 * used by the web app, functions, rules tests and scripts.
 */

/** Rejects empty segments and anything that could escape its path. */
function seg(value: string): string {
  if (value.length === 0 || value.includes('/') || value === '.' || value === '..') {
    throw new Error(`Invalid path segment: "${value}"`);
  }
  return value;
}

export const collections = {
  spaces: 'spaces',
  hosts: 'hosts',
  purchases: 'purchases',
  publicIds: 'publicIds',
  counters: 'counters',
  aliasBookings: 'aliasBookings',
  events: 'events',
  members: 'members',
  guests: 'guests',
  media: 'media',
  wishes: 'wishes',
  folders: 'folders',
  private: 'private',
  auditLog: 'auditLog',
  bugReports: 'bugReports',
  catalog: 'catalog',
} as const;

export const firestorePaths = {
  space: (spaceId: string) => `spaces/${seg(spaceId)}`,
  spaceHost: (spaceId: string, uid: string) => `spaces/${seg(spaceId)}/hosts/${seg(uid)}`,
  spacePurchase: (spaceId: string, purchaseId: string) =>
    `spaces/${seg(spaceId)}/purchases/${seg(purchaseId)}`,
  publicId: (publicId: string) => `publicIds/${seg(publicId)}`,
  spaceCounter: () => 'counters/spaces',
  aliasBooking: (bookingId: string) => `aliasBookings/${seg(bookingId)}`,

  event: (eventId: string) => `events/${seg(eventId)}`,
  eventAccess: (eventId: string) => `events/${seg(eventId)}/private/access`,
  eventMember: (eventId: string, uid: string) => `events/${seg(eventId)}/members/${seg(uid)}`,
  guest: (eventId: string, uid: string) => `events/${seg(eventId)}/guests/${seg(uid)}`,
  media: (eventId: string, mediaId: string) => `events/${seg(eventId)}/media/${seg(mediaId)}`,
  mediaPrivateMeta: (eventId: string, mediaId: string) =>
    `events/${seg(eventId)}/media/${seg(mediaId)}/private/meta`,
  wish: (eventId: string, wishId: string) => `events/${seg(eventId)}/wishes/${seg(wishId)}`,

  folder: (eventId: string, folderId: string) => `events/${seg(eventId)}/folders/${seg(folderId)}`,
  folderAccess: (eventId: string, folderId: string) =>
    `events/${seg(eventId)}/folders/${seg(folderId)}/private/access`,
  folderMember: (eventId: string, folderId: string, uid: string) =>
    `events/${seg(eventId)}/folders/${seg(folderId)}/members/${seg(uid)}`,
  folderMedia: (eventId: string, folderId: string, mediaId: string) =>
    `events/${seg(eventId)}/folders/${seg(folderId)}/media/${seg(mediaId)}`,
  folderMediaPrivateMeta: (eventId: string, folderId: string, mediaId: string) =>
    `events/${seg(eventId)}/folders/${seg(folderId)}/media/${seg(mediaId)}/private/meta`,

  auditLogEntry: (entryId: string) => `auditLog/${seg(entryId)}`,
  bugReport: (reportId: string) => `bugReports/${seg(reportId)}`,
  catalog: () => 'catalog/current',
} as const;

export type DerivedVariant = 'display' | 'thumb' | 'poster' | 'decorated';

/**
 * Storage layout. Originals sit under `/original/` and are never modified;
 * derived copies sit next to them under their variant folder, so the upload
 * trigger can ignore everything that is not an original (pitfall M1).
 */
export const storagePaths = {
  mediaOriginal: (eventId: string, uid: string, mediaId: string) =>
    `events/${seg(eventId)}/media/${seg(uid)}/original/${seg(mediaId)}`,
  mediaDerived: (eventId: string, uid: string, mediaId: string, variant: DerivedVariant, ext: string) =>
    `events/${seg(eventId)}/media/${seg(uid)}/${variant}/${seg(mediaId)}.${seg(ext)}`,

  folderOriginal: (eventId: string, folderId: string, uid: string, mediaId: string) =>
    `events/${seg(eventId)}/folders/${seg(folderId)}/${seg(uid)}/original/${seg(mediaId)}`,
  folderDerived: (
    eventId: string,
    folderId: string,
    uid: string,
    mediaId: string,
    variant: DerivedVariant,
    ext: string,
  ) => `events/${seg(eventId)}/folders/${seg(folderId)}/${seg(uid)}/${variant}/${seg(mediaId)}.${seg(ext)}`,

  guestSelfie: (eventId: string, uid: string, ext: string) =>
    `events/${seg(eventId)}/guests/${seg(uid)}/selfie.${seg(ext)}`,
  spaceTheme: (spaceId: string, fileName: string) => `spaces/${seg(spaceId)}/theme/${seg(fileName)}`,
} as const;

/** True only for original uploads; processing triggers must check this first (pitfall M1). */
export function isOriginalPath(path: string): boolean {
  return /^events\/[^/]+\/(?:media|folders\/[^/]+)\/[^/]+\/original\/[^/]+$/.test(path);
}
