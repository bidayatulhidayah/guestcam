import { describe, expect, it } from 'vitest';
import { isValidAliasName, isValidPublicId, parseSpaceLocation } from '../src/location';

describe('isValidPublicId', () => {
  it('accepts 7 characters from the code alphabet', () => {
    expect(isValidPublicId('7k3qmxa')).toBe(true);
    expect(isValidPublicId('abcdefg')).toBe(true);
  });

  it('rejects wrong length, look-alikes and other characters', () => {
    for (const bad of ['7k3qmx', '7k3qmxab', '7k3qmx1', '7k3qmx0', '7k3qmxl', '7k3qmxo', '7k3qmxi', '7k3-mxa', '']) {
      expect(isValidPublicId(bad)).toBe(false);
    }
  });
});

describe('isValidAliasName', () => {
  it('accepts lowercase letters and digits, 4-30 chars', () => {
    expect(isValidAliasName('zaimhidayah')).toBe(true);
    expect(isValidAliasName('ali2026')).toBe(true);
    expect(isValidAliasName('abcd')).toBe(true);
  });

  it('rejects all-digit names', () => {
    expect(isValidAliasName('10001')).toBe(false);
    expect(isValidAliasName('00000')).toBe(false);
  });

  it('rejects reserved names', () => {
    for (const reserved of ['admin', 'login', 'demo', 'mine', 'assets', 'gallery', 'manifest', 'favicon']) {
      expect(isValidAliasName(reserved)).toBe(false);
    }
  });

  it('rejects bad formats', () => {
    for (const bad of ['abc', 'a'.repeat(31), 'zaim-hidayah', 'zaim_hidayah', 'Zaim', 'sw.js', '']) {
      expect(isValidAliasName(bad)).toBe(false);
    }
  });
});

describe('parseSpaceLocation', () => {
  it('recognises a permanent address with the rest of the path', () => {
    expect(parseSpaceLocation('/s/7k3qmxa')).toEqual({
      kind: 'permanent',
      publicId: '7k3qmxa',
      basePath: '/s/7k3qmxa',
      rest: [],
    });
    expect(parseSpaceLocation('/s/7k3qmxa/tunang-k7q2/')).toEqual({
      kind: 'permanent',
      publicId: '7k3qmxa',
      basePath: '/s/7k3qmxa',
      rest: ['tunang-k7q2'],
    });
  });

  it('recognises an alias', () => {
    expect(parseSpaceLocation('/zaimhidayah/tunang/gallery')).toEqual({
      kind: 'alias',
      aliasName: 'zaimhidayah',
      basePath: '/zaimhidayah',
      rest: ['tunang', 'gallery'],
    });
  });

  it('lowercases the path', () => {
    expect(parseSpaceLocation('/ZaimHidayah')).toMatchObject({ kind: 'alias', aliasName: 'zaimhidayah' });
    expect(parseSpaceLocation('/S/7K3QMXA')).toMatchObject({ kind: 'permanent', publicId: '7k3qmxa' });
  });

  it('rejects invalid permanent ids', () => {
    for (const path of ['/s', '/s/', '/s/1234567', '/s/7k3qmx', '/s/7k3qmxab', '/s/zaimhidayah']) {
      expect(parseSpaceLocation(path)).toEqual({ kind: 'invalid' });
    }
  });

  it('rejects reserved, all-digit and malformed aliases', () => {
    for (const path of ['/', '', '/admin', '/login', '/mine', '/demo', '/10001', '/00000', '/abc', '/sw.js']) {
      expect(parseSpaceLocation(path)).toEqual({ kind: 'invalid' });
    }
  });
});
