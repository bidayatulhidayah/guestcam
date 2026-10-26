import { describe, expect, it } from 'vitest';
import { buildPublicUrl } from '../src/config';

describe('buildPublicUrl', () => {
  it('joins the base URL and a path', () => {
    expect(buildPublicUrl('/s/7k3qmxa', 'https://example.test')).toBe('https://example.test/s/7k3qmxa');
  });

  it('handles trailing and missing slashes', () => {
    expect(buildPublicUrl('s/7k3qmxa/tunang', 'https://example.test/')).toBe(
      'https://example.test/s/7k3qmxa/tunang',
    );
    expect(buildPublicUrl('/mine', 'https://example.test///')).toBe('https://example.test/mine');
  });
});
