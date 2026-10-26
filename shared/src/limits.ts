import type { CaptureFeatureKey } from './features';

export const PLANS = ['internal', 'demo', 'beta', 'trial', 'paid'] as const;
export type Plan = (typeof PLANS)[number];

const KB = 1024;
const MB = 1024 * KB;
const GB = 1024 * MB;

/** Hard cap per file for every plan (storage rules enforce it too, pitfall U6). */
export const MAX_FILE_BYTES = 4 * GB;

/** Recording rules shared by Call the Couple and Video Wish (D-010, D-011). */
export const RECORDING = {
  silenceBeepAfterMs: 45_000,
  silenceEndAfterMs: 60_000,
  capWarningAtMs: 14 * 60_000,
  capEndAtMs: 15 * 60_000,
} as const;

export const BOOMERANG = { minMs: 1_000, maxMs: 2_000 } as const;

export const EVENT_DEFAULTS = {
  /** Uploads stay open this long after the event ends (D-009). */
  uploadWindowDays: 30,
  /** Alias active until event end + this many hours (D-035). */
  aliasGraceHours: 24,
  /** "Happening today" window for resolveCurrentEvent. */
  currentEventWindowHours: 12,
  /** Next upcoming event shown if within this many days. */
  upcomingEventDays: 7,
  maxFoldersPerGuest: 5,
  /** Items captured before a feature is switched off may still upload (pitfall T2). */
  featureOffGraceHours: 24,
} as const;

export const FOLDER = { pinLength: 6, idLength: 10, emptyFolderDeleteAfterHours: 24 } as const;

export const JOIN_RATE_LIMITS = {
  eventCodeTriesPerDevice: 5,
  folderPinTriesPerDevicePer15Min: 5,
  folderPinTriesPerIpPerHour: 20,
  folderPinTriesPerFolderPerDay: 50,
} as const;

/** `null` means no limit from the plan (the package or host settings may still set one). */
export interface PlanLimits {
  maxGuests: number | null;
  maxUploadsTotal: number | null;
  maxUploadsPerGuest: number | null;
  maxStorageBytes: number | null;
  maxFileBytes: number;
  maxVideoWishMs: number;
  /** Capture functions allowed by the plan; `null` = all. */
  allowedCaptureFeatures: readonly CaptureFeatureKey[] | null;
  /** Uploads deleted automatically after this many hours (demo). */
  autoDeleteAfterHours: number | null;
  trialDays: number | null;
  /** Read-only days after a trial ends, before deletion. */
  readOnlyDaysAfterExpiry: number | null;
  watermark: boolean;
  /** Label shown next to the space number and, for demo/trial, to guests. */
  badge: 'demo' | 'trial' | null;
}

const UNLIMITED: PlanLimits = {
  maxGuests: null,
  maxUploadsTotal: null,
  maxUploadsPerGuest: null,
  maxStorageBytes: null,
  maxFileBytes: MAX_FILE_BYTES,
  maxVideoWishMs: RECORDING.capEndAtMs,
  allowedCaptureFeatures: null,
  autoDeleteAfterHours: null,
  trialDays: null,
  readOnlyDaysAfterExpiry: null,
  watermark: false,
  badge: null,
};

/**
 * Per-plan limits (architecture.md Part 4, initial proposal).
 * A trial converts to paid by changing `plan` only.
 */
export const PLAN_LIMITS: Readonly<Record<Plan, PlanLimits>> = {
  internal: UNLIMITED,
  demo: {
    ...UNLIMITED,
    maxUploadsPerGuest: 5,
    maxFileBytes: 50 * MB,
    maxVideoWishMs: 30_000,
    allowedCaptureFeatures: ['snapshot', 'videoWish'],
    autoDeleteAfterHours: 24,
    badge: 'demo',
  },
  beta: UNLIMITED,
  trial: {
    ...UNLIMITED,
    maxGuests: 20,
    maxUploadsTotal: 100,
    maxStorageBytes: 2 * GB,
    trialDays: 14,
    readOnlyDaysAfterExpiry: 7,
    watermark: true,
    badge: 'trial',
  },
  paid: UNLIMITED,
};

export function getPlanLimits(plan: Plan): PlanLimits {
  return PLAN_LIMITS[plan];
}
