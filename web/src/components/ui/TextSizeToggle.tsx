import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { readTextSize, saveTextSize, type TextSize } from '../../lib/device/textSize';

/** "Aa" in the top row: one tap switches Biasa / Besar (D-092). */
export function TextSizeToggle() {
  const { t } = useTranslation();
  const [size, setSize] = useState<TextSize>(readTextSize);
  const large = size === 'large';
  const next: TextSize = large ? 'normal' : 'large';
  return (
    <button
      type="button"
      aria-pressed={large}
      aria-label={t('textSize.switchLabel', { current: t(`textSize.${size}`), next: t(`textSize.${next}`) })}
      onClick={() => {
        saveTextSize(next);
        setSize(next);
      }}
      className={[
        'inline-flex min-h-11 min-w-11 items-center justify-center gap-1 rounded-card border px-3 text-caption font-bold text-ink',
        large ? 'border-accent bg-accent-tint' : 'border-line active:bg-paper-2',
      ].join(' ')}
    >
      <span aria-hidden="true">
        A<span className="text-[1.25em]">a</span>
      </span>
      <span>{t(`textSize.${size}`)}</span>
    </button>
  );
}
