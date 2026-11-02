import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

/** The colour tokens as written in tokens.css (the only place colours live). */
function tokens(): Record<string, string> {
  const css = readFileSync(new URL('../src/styles/tokens.css', import.meta.url), 'utf8');
  const root = css.slice(css.indexOf(':root {'), css.indexOf('}'));
  return Object.fromEntries([...root.matchAll(/--([\w-]+):\s*(#[0-9a-f]{6})/gi)].map(([, name, hex]) => [name, hex]));
}

const rgb = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
const channel = (c: number) => {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
};
const luminance = (hex: string) => {
  const [r = 0, g = 0, b = 0] = rgb(hex).map(channel);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
/** WCAG 2 contrast ratio. */
const contrast = (a: string, b: string) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
};
/** `--accent-tint`: the accent at 10% over paper (tokens.css, color-mix). */
const mix = (a: string, b: string, share: number) =>
  `#${rgb(a)
    .map((c, i) => Math.round(c * share + (rgb(b)[i] ?? 0) * (1 - share)))
    .map((c) => c.toString(16).padStart(2, '0'))
    .join('')}`;

describe('colour contrast of the design tokens (D-092: 4.5:1 for all text at standard sizes)', () => {
  const t = tokens();
  const tint = mix(t.accent!, t.paper!, 0.1);
  const pairs: [string, string, string][] = [
    ['body text on paper', t.ink!, t.paper!],
    ['body text on raised paper', t.ink!, t['paper-2']!],
    ['secondary text (13-14 px) on paper', t['ink-2']!, t.paper!],
    ['secondary text on raised paper', t['ink-2']!, t['paper-2']!],
    ['couple names and links in the accent', t.accent!, t.paper!],
    ['text on accent buttons', t['on-accent']!, t.accent!],
    ['text on danger buttons', t['on-accent']!, t.danger!],
    ['error text on paper', t.danger!, t.paper!],
    ['text on a selected card (accent tint)', t.ink!, tint],
  ];
  it.each(pairs)('%s passes 4.5:1', (_name, fg, bg) => {
    expect(contrast(fg, bg)).toBeGreaterThanOrEqual(4.5);
  });
});
