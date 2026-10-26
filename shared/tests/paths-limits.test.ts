import { describe, expect, it } from 'vitest';
import { PLANS, PLAN_LIMITS, MAX_FILE_BYTES } from '../src/limits';
import { firestorePaths, isOriginalPath, storagePaths } from '../src/paths';

describe('paths', () => {
  it('builds firestore paths', () => {
    expect(firestorePaths.mediaPrivateMeta('e1', 'm1')).toBe('events/e1/media/m1/private/meta');
    expect(firestorePaths.folderMember('e1', 'f1', 'u1')).toBe('events/e1/folders/f1/members/u1');
  });

  it('rejects segments that could escape the path', () => {
    expect(() => firestorePaths.event('a/b')).toThrow();
    expect(() => firestorePaths.event('')).toThrow();
    expect(() => storagePaths.mediaOriginal('e1', '..', 'm1')).toThrow();
  });

  it('only original uploads count as originals', () => {
    expect(isOriginalPath(storagePaths.mediaOriginal('e1', 'u1', 'm1'))).toBe(true);
    expect(isOriginalPath(storagePaths.folderOriginal('e1', 'f1', 'u1', 'm1'))).toBe(true);
    expect(isOriginalPath(storagePaths.mediaDerived('e1', 'u1', 'm1', 'thumb', 'webp'))).toBe(false);
    expect(isOriginalPath(storagePaths.folderDerived('e1', 'f1', 'u1', 'm1', 'display', 'webp'))).toBe(false);
    expect(isOriginalPath(storagePaths.guestSelfie('e1', 'u1', 'jpg'))).toBe(false);
  });
});

describe('plan limits', () => {
  it('defines every plan', () => {
    for (const plan of PLANS) expect(PLAN_LIMITS[plan]).toBeDefined();
  });

  it('never allows files above the global cap', () => {
    for (const plan of PLANS) expect(PLAN_LIMITS[plan].maxFileBytes).toBeLessThanOrEqual(MAX_FILE_BYTES);
  });

  it('beta behaves like paid', () => {
    expect(PLAN_LIMITS.beta).toEqual(PLAN_LIMITS.paid);
  });
});
