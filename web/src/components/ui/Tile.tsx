import type { ReactNode } from 'react';
import { Link } from 'react-router';

export interface TileProps {
  /** Outline icon, 28-32px. */
  icon: ReactNode;
  /** One short word. */
  label: string;
  /** Navigates when set; otherwise behaves as a button. */
  to?: string;
  onClick?: () => void;
  /** Spans both columns of the menu grid (Galeri, or an odd last tile). */
  wide?: boolean;
  /** Shown but not tappable (e.g. "Akan datang"). */
  disabled?: boolean;
  /** Small line under the label, e.g. "Akan datang" or "Berkunci". */
  note?: string;
}

const base =
  'flex min-h-32 flex-col items-center justify-center gap-2 rounded-card border p-4 text-center text-body font-bold';
const enabled =
  'border-line bg-paper-2 text-ink transition-colors duration-150 active:border-accent active:bg-accent-tint';
const muted = 'border-line bg-paper text-ink-2';

/** Large menu tile: icon + one word (design.md, Layout and shape). */
export function Tile({ icon, label, to, onClick, wide = false, disabled = false, note }: TileProps) {
  const className = [base, disabled ? muted : enabled, wide ? 'col-span-2' : ''].join(' ');
  const content = (
    <>
      <span aria-hidden="true" className="inline-flex size-8 items-center justify-center">
        {icon}
      </span>
      <span>{label}</span>
      {note ? <span className="text-caption font-normal text-ink-2">{note}</span> : null}
    </>
  );

  if (disabled) {
    return (
      <div role="button" aria-disabled="true" className={className}>
        {content}
      </div>
    );
  }
  if (to !== undefined) {
    return (
      <Link to={to} className={className}>
        {content}
      </Link>
    );
  }
  return (
    <button type="button" onClick={onClick} className={className}>
      {content}
    </button>
  );
}
