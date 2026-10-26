import { describe, expect, it } from 'vitest';
import en from '../src/i18n/en.json';
import ms from '../src/i18n/ms.json';

type Tree = { [key: string]: string | Tree };

function flatten(tree: Tree, prefix = ''): Map<string, string> {
  const result = new Map<string, string>();
  for (const [key, value] of Object.entries(tree)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (typeof value === 'string') result.set(path, value);
    else for (const [k, v] of flatten(value, path)) result.set(k, v);
  }
  return result;
}

function variables(text: string): string[] {
  return [...text.matchAll(/\{\{\s*(\w+)\s*\}\}/g)].map((match) => match[1] ?? '').sort();
}

const msKeys = flatten(ms as Tree);
const enKeys = flatten(en as Tree);

describe('i18n files (pitfall A3)', () => {
  it('ms.json and en.json have exactly the same keys', () => {
    const onlyInMs = [...msKeys.keys()].filter((key) => !enKeys.has(key));
    const onlyInEn = [...enKeys.keys()].filter((key) => !msKeys.has(key));
    expect({ onlyInMs, onlyInEn }).toEqual({ onlyInMs: [], onlyInEn: [] });
  });

  it('has no empty strings', () => {
    for (const [key, value] of [...msKeys, ...enKeys]) {
      expect(value.trim(), key).not.toBe('');
    }
  });

  it('uses the same {{variables}} in both languages', () => {
    for (const [key, value] of msKeys) {
      expect(variables(enKeys.get(key) ?? ''), key).toEqual(variables(value));
    }
  });

  it('has the appName key', () => {
    expect(msKeys.get('appName')).toBeTruthy();
    expect(enKeys.get('appName')).toBeTruthy();
  });
});
