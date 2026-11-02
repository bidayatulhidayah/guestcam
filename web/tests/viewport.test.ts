import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('viewport (D-092)', () => {
  it('never blocks pinch-zoom', () => {
    const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
    const viewport = /<meta name="viewport" content="([^"]*)"/.exec(html)?.[1] ?? '';
    expect(viewport).toContain('width=device-width');
    expect(viewport).not.toMatch(/maximum-scale|user-scalable\s*=\s*(no|0)/);
  });
});
