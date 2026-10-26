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
}

const tileClasses = [
  'flex min-h-32 flex-col items-center justify-center gap-2 rounded-card border border-line bg-paper-2 p-4',
  'text-body font-bold text-ink',
  'transition-colors duration-150 active:bg-accent-tint active:border-accent',
].join(' ');

/** Large menu tile: icon + one word (design.md, Layout and shape). */
export function Tile({ icon, label, to, onClick, wide = false }: TileProps) {
  const className = `${tileClasses} ${wide ? 'col-span-2' : ''}`;
  const content = (
    <>
      <span aria-hidden="true" className="inline-flex size-8 items-center justify-center">
        {icon}
      </span>
      <span>{label}</span>
    </>
  );

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
