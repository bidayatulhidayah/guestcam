/**
 * Firestore document shapes (architecture.md Parts 2, 3, 5 and 6).
 * Document ids are not stored as fields unless noted.
 */
import type { CaptureFeatureKey, EnabledFeatures, Entitlements, FeatureKey, PackageKey } from './features';
import type { Plan } from './limits';

/**
 * Structural timestamp satisfied by both the web SDK and the Admin SDK
 * `Timestamp`, so shared code does not depend on either.
 */
export interface Timestamp {
  readonly seconds: number;
  readonly nanoseconds: number;
  toDate(): Date;
  toMillis(): number;
}

export type Language = 'ms' | 'en';
export type Localized = Record<Language, string>;

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

export const HOST_ROLES = ['owner', 'moderator'] as const;
export type HostRole = (typeof HOST_ROLES)[number];

export const EVENT_TYPES = ['engagement', 'solemnization', 'reception', 'other'] as const;
export type EventType = (typeof EVENT_TYPES)[number];

export const GALLERY_MODES = ['live', 'afterEvent', 'off'] as const;
export type GalleryMode = (typeof GALLERY_MODES)[number];

export const EVENT_STATUSES = ['draft', 'active', 'closed', 'archived'] as const;
export type EventStatus = (typeof EVENT_STATUSES)[number];

export const VISIBILITIES = ['private', 'public'] as const;
export type Visibility = (typeof VISIBILITIES)[number];

/** Upload and processing lifecycle. The gallery shows only `ready` (pitfall U2). */
export const MEDIA_STATUSES = ['queued', 'uploaded', 'processing', 'ready', 'failed'] as const;
export type MediaStatus = (typeof MEDIA_STATUSES)[number];

export const MEDIA_TYPES = ['image', 'video', 'audio'] as const;
export type MediaType = (typeof MEDIA_TYPES)[number];

/** Which function created the item. Values are feature keys, so they can be checked against toggles. */
export type MediaSource = CaptureFeatureKey;

export const CAPTURED_AT_SOURCES = ['exif', 'device', 'upload'] as const;
export type CapturedAtSource = (typeof CAPTURED_AT_SOURCES)[number];

export const FOLDER_STATUSES = ['active', 'deleted'] as const;
export type FolderStatus = (typeof FOLDER_STATUSES)[number];

export const FOLDER_MEMBER_ROLES = ['creator', 'contributor'] as const;
export type FolderMemberRole = (typeof FOLDER_MEMBER_ROLES)[number];

export const AUDIT_ACTIONS = [
  'mediaHide',
  'mediaUnhide',
  'mediaDelete',
  'eventCreate',
  'eventUpdate',
  'eventDelete',
  'eventExport',
  'eventCodeRegenerate',
  'featuresUpdate',
  'aliasBook',
  'aliasCancel',
  'folderPinReset',
  'folderDelete',
  'hostAdd',
  'hostRemove',
  'planChange',
  'entitlementsUpdate',
] as const;
export type AuditAction = (typeof AUDIT_ACTIONS)[number];

// ---------------------------------------------------------------------------
// Spaces and access
// ---------------------------------------------------------------------------

export interface Theme {
  /** Hex colour, contrast-checked against paper (design.md). */
  accent: string;
  /** Optional display font family; default Instrument Serif. */
  displayFont: string | null;
  coverPath: string | null;
  monogramPath: string | null;
  /** Bumped on every edit so cached themes refresh (pitfall A2). */
  themeVersion: number;
}

/** `spaces/{spaceId}` */
export interface Space {
  /** 7 random chars, permanent, used in `/s/:publicId`. */
  publicId: string;
  /** 5 digits, zero-padded, internal only. Never in a URL or guest UI. */
  spaceNumber: string;
  plan: Plan;
  trialEndsAt: Timestamp | null;
  /** Couple names as shown to guests, e.g. "Zaim & Hidayah". */
  displayNames: string;
  defaultTheme: Theme;
  package: PackageKey | null;
  /** Add-on keys from `catalog/current.addOns`. */
  addOns: string[];
  entitlementOverrides: Entitlements;
  /** Computed by a function; server-written only. */
  entitlements: Entitlements;
  createdAt: Timestamp;
}

/** `spaces/{spaceId}/hosts/{uid}` */
export interface SpaceHost {
  role: HostRole;
  addedAt: Timestamp;
  addedBy: string;
}

/** `publicIds/{publicId}`: unique index, created in a transaction. */
export interface PublicIdIndex {
  spaceId: string;
}

/** `counters/spaces` (server only). */
export interface SpaceCounter {
  /** Starts at 10001. */
  nextClientNumber: number;
}

/** `aliasBookings/{bookingId}` */
export interface AliasBooking {
  aliasName: string;
  spaceId: string;
  eventId: string;
  activeFrom: Timestamp;
  activeUntil: Timestamp;
  createdBy: string;
  createdAt: Timestamp;
}

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------

/** `events/{eventId}` */
export interface Event {
  spaceId: string;
  eventSlug: string;
  type: EventType;
  title: Localized;
  startAt: Timestamp;
  endAt: Timestamp;
  /** IANA time zone, e.g. "Asia/Kuala_Lumpur". */
  timeZone: string;
  uploadUntil: Timestamp;
  /** Overrides the space default theme. */
  theme: Partial<Theme> | null;
  galleryMode: GalleryMode;
  revealAt: Timestamp | null;
  status: EventStatus;
  /** Owner-written; only keys the space is entitled to. */
  enabledFeatures: EnabledFeatures;
  featureChangedAt: Partial<Record<FeatureKey, Timestamp>>;
  /** Total uploads after which the per-guest quota switches on (D-016); null = never. */
  perGuestQuotaThreshold: number | null;
  perGuestQuota: number | null;
  maxFoldersPerGuest: number;
}

/** `events/{eventId}/private/access` (server only). */
export interface EventAccess {
  code: string;
  linkedEventIds: string[];
}

/** `events/{eventId}/members/{uid}` (written only by `joinEvent`). */
export interface EventMember {
  joinedAt: Timestamp;
  /** Joined with this event's code, or through a linked event. */
  via: 'code' | 'linkedEvent';
}

/** `events/{eventId}/guests/{uid}`: readable only by that guest and hosts. */
export interface Guest {
  displayName: string;
  selfieThumbPath: string | null;
  /** Set on the first upload (selfie does not count, D-005). */
  galleryUnlocked: boolean;
  firstUploadAt: Timestamp | null;
  /** Remembered privacy choice for the next item (D-006). */
  lastVisibility: Visibility;
  showName: boolean;
  language: Language;
  joinedAt: Timestamp;
}

export interface DecorationRecipe {
  nameStamp: boolean;
  frameId: string | null;
  filterId: string | null;
}

/**
 * `events/{eventId}/media/{mediaId}` and
 * `events/{eventId}/folders/{folderId}/media/{mediaId}`.
 * `mediaId` is a UUID made at capture; it is also the storage file name (pitfall U1).
 * Never holds a guest name unless `showName` is true (pitfall P2) and never
 * location or raw EXIF (pitfall P1, see `MediaPrivateMeta`).
 */
export interface Media {
  eventId: string;
  spaceId: string;
  /** Set only for folder media. */
  folderId: string | null;
  ownerUid: string;
  source: MediaSource;
  type: MediaType;
  status: MediaStatus;
  visibility: Visibility;
  hidden: boolean;
  showName: boolean;
  /** Copied by a function only when `showName` is true. */
  ownerName: string | null;
  ownerSelfieThumbPath: string | null;
  contentType: string;
  sizeBytes: number;
  width: number | null;
  height: number | null;
  durationMs: number | null;
  originalPath: string;
  displayPath: string | null;
  thumbPath: string | null;
  posterPath: string | null;
  decoration: DecorationRecipe | null;
  decoratedPath: string | null;
  capturedAt: Timestamp | null;
  capturedAtSource: CapturedAtSource;
  /** Always a server timestamp (pitfall M9). */
  uploadedAt: Timestamp | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface GeoLocation {
  lat: number;
  lng: number;
  accuracyM: number | null;
  source: 'exif' | 'device';
}

/** `.../media/{mediaId}/private/meta`: hosts only. */
export interface MediaPrivateMeta {
  location: GeoLocation | null;
  /** Whitelisted EXIF fields only (pitfall M7). */
  exif: Record<string, string | number | boolean | null>;
  originalFileName: string | null;
}

/** `events/{eventId}/wishes/{wishId}` */
export interface Wish {
  eventId: string;
  spaceId: string;
  ownerUid: string;
  text: string;
  /** Optional photo, stored as a media item. */
  photoMediaId: string | null;
  visibility: Visibility;
  hidden: boolean;
  showName: boolean;
  ownerName: string | null;
  status: MediaStatus;
  createdAt: Timestamp;
}

// ---------------------------------------------------------------------------
// Shared folders (architecture.md Part 5)
// ---------------------------------------------------------------------------

/** `events/{eventId}/folders/{folderId}` */
export interface Folder {
  name: string;
  ownerUid: string;
  ownerName: string;
  createdAt: Timestamp;
  lastActivityAt: Timestamp;
  itemCount: number;
  sizeBytes: number;
  coverThumbPath: string | null;
  pinVersion: number;
  status: FolderStatus;
}

/** `events/{eventId}/folders/{folderId}/private/access` */
export interface FolderAccess {
  pin: string;
  failedAttempts: number;
  lockedUntil: Timestamp | null;
}

/** `events/{eventId}/folders/{folderId}/members/{uid}` (server only). */
export interface FolderMember {
  role: FolderMemberRole;
  joinedAt: Timestamp;
  pinVersion: number;
}

// ---------------------------------------------------------------------------
// Catalog and purchases (architecture.md Part 6). Money in sen (integers).
// ---------------------------------------------------------------------------

export interface CatalogPackage {
  features: FeatureKey[];
  /** Price in sen per guest tier key, e.g. { "100": 15000 }. */
  priceByGuestTier: Record<string, number>;
}

export interface CatalogAddOn {
  feature: FeatureKey | null;
  quantity: { unit: 'event' | 'guests' | 'storageMonths'; amount: number } | null;
  priceSen: number;
}

/** `catalog/current` */
export interface Catalog {
  features: FeatureKey[];
  packages: Partial<Record<PackageKey, CatalogPackage>>;
  addOns: Record<string, CatalogAddOn>;
  currency: 'MYR';
  catalogVersion: number;
}

/** `spaces/{spaceId}/purchases/{purchaseId}` */
export interface Purchase {
  package: PackageKey;
  addOns: string[];
  guestTier: string;
  /** Prices as they were at purchase, so catalog changes never affect it (pitfall T3). */
  priceSnapshot: { lines: { key: string; priceSen: number }[]; totalSen: number };
  catalogVersion: number;
  paidAt: Timestamp;
  invoiceNo: string;
}

// ---------------------------------------------------------------------------
// Support and audit
// ---------------------------------------------------------------------------

/** `bugReports/{reportId}` */
export interface BugReport {
  spaceId: string | null;
  eventId: string | null;
  uid: string | null;
  message: string;
  route: string;
  appVersion: string;
  language: Language;
  device: {
    userAgent: string;
    viewport: string;
    online: boolean;
    inAppBrowser: string | null;
    storageQuotaBytes: number | null;
    storageUsageBytes: number | null;
  };
  queue: { pending: number; failed: number; uploading: number };
  createdAt: Timestamp;
}

/** `auditLog/{entryId}`: written by the server only. */
export interface AuditLogEntry {
  spaceId: string;
  eventId: string | null;
  uid: string;
  action: AuditAction;
  /** Path or id of the thing acted on. */
  target: string | null;
  details: Record<string, string | number | boolean | null> | null;
  at: Timestamp;
}
