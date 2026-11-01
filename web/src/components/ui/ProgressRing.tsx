import { useTranslation } from 'react-i18next';

export interface ProgressRingProps {
  /** Share sent, 0–100 (shown as at most 99%). Missing: waiting its turn (a slowly turning arc). */
  percent?: number | null | undefined;
  /** What the circle means, for screen readers. */
  label: string;
  /** Outer size in px; 56 fits the 15px number. */
  size?: number;
  /** Stop the turning arc, e.g. while offline. */
  still?: boolean;
}

/**
 * Upload progress as a circle on a paper disc: the accent arc and a number
 * (design.md: status in accent, words for screen readers). The turning arc
 * stops when the phone asks for reduced motion (index.css).
 */
export function ProgressRing({ percent, label, size = 56, still = false }: ProgressRingProps) {
  const { t } = useTranslation();
  const known = typeof percent === 'number';
  // At most 99 while sending: an item is done only when the server confirms it (then the "Dihantar" mark shows).
  const value = known ? Math.max(0, Math.min(99, Math.round(percent))) : 0;
  const circumference = 2 * Math.PI * 20;
  return (
    <span
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      {...(known ? { 'aria-valuenow': value } : {})}
      className="relative inline-flex shrink-0 items-center justify-center rounded-full bg-paper"
      style={{ width: size, height: size }}
    >
      <svg
        viewBox="0 0 48 48"
        width={size}
        height={size}
        aria-hidden="true"
        className={`absolute inset-0 -rotate-90 ${!known && !still ? 'animate-[spin_1.6s_linear_infinite]' : ''}`}
      >
        <circle cx="24" cy="24" r="20" fill="none" className="stroke-line" strokeWidth={4} />
        <circle
          cx="24"
          cy="24"
          r="20"
          fill="none"
          className="stroke-accent"
          strokeWidth={4}
          strokeLinecap="round"
          strokeDasharray={circumference}
          // Known: the share sent. Waiting: a quarter arc that turns.
          strokeDashoffset={circumference * (known ? 1 - value / 100 : 0.75)}
        />
      </svg>
      {known ? (
        <span aria-hidden="true" className="relative text-caption font-bold text-ink">
          {t('queue.percent', { percent: value })}
        </span>
      ) : null}
    </span>
  );
}
