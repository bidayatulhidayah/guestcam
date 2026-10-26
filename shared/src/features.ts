/**
 * Feature catalog: the ONLY place feature keys are defined.
 * Used by the web app, functions and rules tests (architecture.md Part 6).
 *
 * Proposed, not yet in the catalog: `folderDirectLink` (folder link without PIN).
 */
export const FEATURE_KEYS = [
  'snapshot',
  'galleryUpload',
  'textWish',
  'videoWish',
  'voiceCall',
  'boomerang',
  'sharedFolder',
  'publicGallery',
  'decoration',
  'nameStamp',
  'customTheme',
  'cleanAlias',
  'multiEvent',
  'moderatorRole',
  'fullExport',
  'extendedStorage',
] as const;

export type FeatureKey = (typeof FEATURE_KEYS)[number];

/** Features that let a guest add content. An event must keep at least one enabled (pitfall T5). */
export const CAPTURE_FEATURE_KEYS = [
  'snapshot',
  'galleryUpload',
  'textWish',
  'videoWish',
  'voiceCall',
  'boomerang',
  'sharedFolder',
] as const satisfies readonly FeatureKey[];

export type CaptureFeatureKey = (typeof CAPTURE_FEATURE_KEYS)[number];

/** What the space has paid for (server-written, `spaces/{id}.entitlements`). */
export type Entitlements = Partial<Record<FeatureKey, boolean>>;

/** What the owners switched on for one event (`events/{id}.enabledFeatures`). */
export type EnabledFeatures = Partial<Record<FeatureKey, boolean>>;

export const PACKAGE_KEYS = ['asas', 'lengkap', 'premium', 'custom'] as const;
export type PackageKey = (typeof PACKAGE_KEYS)[number];

const ASAS: readonly FeatureKey[] = [
  'snapshot',
  'galleryUpload',
  'textWish',
  'publicGallery',
  'customTheme',
];
const LENGKAP: readonly FeatureKey[] = [...ASAS, 'videoWish', 'voiceCall', 'boomerang', 'nameStamp'];
const PREMIUM: readonly FeatureKey[] = [
  ...LENGKAP,
  'sharedFolder',
  'decoration',
  'cleanAlias',
  'multiEvent',
  'moderatorRole',
  'fullExport',
];

/**
 * Proposed package contents (D-046). Prices are NOT here: they live in
 * `catalog/current` as data. `custom` starts empty and is set per space.
 */
export const PACKAGE_FEATURES: Readonly<Record<PackageKey, readonly FeatureKey[]>> = {
  asas: ASAS,
  lengkap: LENGKAP,
  premium: PREMIUM,
  custom: [],
};

export function isFeatureKey(value: string): value is FeatureKey {
  return (FEATURE_KEYS as readonly string[]).includes(value);
}

/** Effective feature = ENTITLED (space) AND ENABLED (event). Missing means off. */
export function isFeatureAvailable(
  entitlements: Entitlements | null | undefined,
  enabledFeatures: EnabledFeatures | null | undefined,
  key: FeatureKey,
): boolean {
  return entitlements?.[key] === true && enabledFeatures?.[key] === true;
}

/**
 * Computes entitlements from a package, single-feature add-ons and super-admin
 * overrides (an override of `false` removes a feature).
 */
export function computeEntitlements(
  packageKey: PackageKey | null,
  addOnFeatures: readonly FeatureKey[] = [],
  overrides: Entitlements = {},
): Entitlements {
  const result: Entitlements = {};
  const included = packageKey ? PACKAGE_FEATURES[packageKey] : [];
  for (const key of [...included, ...addOnFeatures]) result[key] = true;
  for (const key of FEATURE_KEYS) {
    const override = overrides[key];
    if (override === true) result[key] = true;
    if (override === false) delete result[key];
  }
  return result;
}

/** Every feature on: internal, demo and trial spaces (plan limits still apply). */
export function allFeatures(): Record<FeatureKey, true> {
  return Object.fromEntries(FEATURE_KEYS.map((key) => [key, true])) as Record<FeatureKey, true>;
}
