import { describe, expect, it } from 'vitest';
import {
  CAPTURE_FEATURE_KEYS,
  FEATURE_KEYS,
  PACKAGE_FEATURES,
  allFeatures,
  computeEntitlements,
  isFeatureAvailable,
  isFeatureKey,
} from '../src/features';

describe('feature catalog', () => {
  it('has 16 unique keys', () => {
    expect(FEATURE_KEYS).toHaveLength(16);
    expect(new Set(FEATURE_KEYS).size).toBe(FEATURE_KEYS.length);
  });

  it('capture features are catalog keys', () => {
    for (const key of CAPTURE_FEATURE_KEYS) expect(isFeatureKey(key)).toBe(true);
  });

  it('packages build on each other', () => {
    for (const key of PACKAGE_FEATURES.asas) expect(PACKAGE_FEATURES.lengkap).toContain(key);
    for (const key of PACKAGE_FEATURES.lengkap) expect(PACKAGE_FEATURES.premium).toContain(key);
    expect(PACKAGE_FEATURES.custom).toEqual([]);
  });

  it('isFeatureKey rejects unknown keys', () => {
    expect(isFeatureKey('folderDirectLink')).toBe(false);
    expect(isFeatureKey('snapshot')).toBe(true);
  });
});

describe('isFeatureAvailable', () => {
  it('requires both entitled AND enabled', () => {
    expect(isFeatureAvailable({ voiceCall: true }, { voiceCall: true }, 'voiceCall')).toBe(true);
    expect(isFeatureAvailable({ voiceCall: true }, { voiceCall: false }, 'voiceCall')).toBe(false);
    expect(isFeatureAvailable({ voiceCall: false }, { voiceCall: true }, 'voiceCall')).toBe(false);
    expect(isFeatureAvailable({}, { voiceCall: true }, 'voiceCall')).toBe(false);
    expect(isFeatureAvailable({ voiceCall: true }, {}, 'voiceCall')).toBe(false);
  });

  it('treats missing data as off', () => {
    expect(isFeatureAvailable(null, null, 'snapshot')).toBe(false);
    expect(isFeatureAvailable(undefined, { snapshot: true }, 'snapshot')).toBe(false);
  });
});

describe('computeEntitlements', () => {
  it('includes package features plus add-ons', () => {
    const result = computeEntitlements('asas', ['voiceCall']);
    expect(result.snapshot).toBe(true);
    expect(result.voiceCall).toBe(true);
    expect(result.videoWish).toBeUndefined();
  });

  it('applies overrides both ways', () => {
    const result = computeEntitlements('lengkap', [], { boomerang: false, sharedFolder: true });
    expect(result.boomerang).toBeUndefined();
    expect(result.sharedFolder).toBe(true);
  });

  it('allFeatures entitles every key', () => {
    const all = allFeatures();
    for (const key of FEATURE_KEYS) expect(all[key]).toBe(true);
  });
});
