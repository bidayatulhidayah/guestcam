import { describe, expect, it } from 'vitest';
import { parseEntry } from '../src/entry';

describe('parseEntry', () => {
  it('parses a simple slug with a code', () => {
    expect(parseEntry('tunang-k7q2')).toEqual({ kind: 'withCode', eventSlug: 'tunang', code: 'k7q2' });
  });

  it('splits on the LAST hyphen for hyphenated slugs', () => {
    expect(parseEntry('zaim-hidayah-k7q2')).toEqual({
      kind: 'withCode',
      eventSlug: 'zaim-hidayah',
      code: 'k7q2',
    });
    expect(parseEntry('majlis-sanding-kl-ab23')).toEqual({
      kind: 'withCode',
      eventSlug: 'majlis-sanding-kl',
      code: 'ab23',
    });
  });

  it('lowercases uppercase codes and slugs', () => {
    expect(parseEntry('tunang-K7Q2')).toEqual({ kind: 'withCode', eventSlug: 'tunang', code: 'k7q2' });
    expect(parseEntry('Tunang-K7Q2')).toEqual({ kind: 'withCode', eventSlug: 'tunang', code: 'k7q2' });
  });

  it('returns slug only when there is no code', () => {
    expect(parseEntry('tunang')).toEqual({ kind: 'slugOnly', eventSlug: 'tunang' });
    expect(parseEntry('zaim-hidayah')).toEqual({ kind: 'slugOnly', eventSlug: 'zaim-hidayah' });
  });

  it('does not treat invalid codes as codes', () => {
    // look-alike characters (i, l, o, 0, 1) are not in the code alphabet
    for (const bad of ['k7q1', 'k7q0', 'k7qo', 'k7ql', 'k7qi']) {
      expect(parseEntry(`tunang-${bad}`)).toEqual({ kind: 'slugOnly', eventSlug: `tunang-${bad}` });
    }
    // wrong length
    expect(parseEntry('tunang-k7q')).toEqual({ kind: 'slugOnly', eventSlug: 'tunang-k7q' });
    expect(parseEntry('tunang-k7q22')).toEqual({ kind: 'slugOnly', eventSlug: 'tunang-k7q22' });
  });

  it('rejects malformed entries', () => {
    for (const bad of ['', '-', '-k7q2', 'tunang-', 'tunang--k7q2', 'tu nang', 'tunang_k7q2', 'a', '%E0%A4%A']) {
      expect(parseEntry(bad)).toEqual({ kind: 'invalid' });
    }
  });

  it('rejects reserved slugs, with or without a code', () => {
    for (const reserved of ['gallery', 'admin', 'login', 'mine', 'assets', 'manifest', 'sw']) {
      expect(parseEntry(reserved)).toEqual({ kind: 'invalid' });
      expect(parseEntry(`${reserved}-k7q2`)).toEqual({ kind: 'invalid' });
    }
    expect(parseEntry('GALLERY')).toEqual({ kind: 'invalid' });
  });

  it('decodes URL-encoded input', () => {
    expect(parseEntry('tunang%2DK7Q2')).toEqual({ kind: 'withCode', eventSlug: 'tunang', code: 'k7q2' });
  });
});
