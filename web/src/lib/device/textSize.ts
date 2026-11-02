import { readJson, writeJson } from './localJson';

/**
 * "Aa" text size (D-092): Biasa or Besar. Besar scales the root font size
 * (index.css), and every size is in rem, so the whole app grows together.
 * Saved on this device; Biasa when storage is blocked.
 */
export type TextSize = 'normal' | 'large';

const KEY = 'textSize';

export function readTextSize(): TextSize {
  return readJson<TextSize>(KEY) === 'large' ? 'large' : 'normal';
}

export function applyTextSize(size: TextSize): void {
  if (size === 'large') document.documentElement.dataset.textSize = 'large';
  else delete document.documentElement.dataset.textSize;
}

export function saveTextSize(size: TextSize): void {
  writeJson(KEY, size);
  applyTextSize(size);
}
