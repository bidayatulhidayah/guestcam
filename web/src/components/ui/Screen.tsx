import type { ReactNode } from 'react';
import { BackLink } from './BackLink';

export interface ScreenProps {
  /** Screen title, set in the display serif. */
  title?: ReactNode;
  /** Small line above the title, e.g. the couple's names on inner screens. */
  eyebrow?: ReactNode;
  /** Small "Kembali" above the title: `true` for the previous page, or what going back does here. */
  back?: true | (() => void);
  children: ReactNode;
  /** Content pinned under the main area (main action, footer). */
  bottom?: ReactNode;
}

/** Single-column page: 20px side margins, 8px spacing grid (design.md). */
export function Screen({ title, eyebrow, back, children, bottom }: ScreenProps) {
  return (
    <div className="mx-auto flex w-full max-w-lg flex-1 flex-col px-5 pt-4 pb-8">
      {back !== undefined ? <BackLink onBack={back === true ? undefined : back} /> : null}
      {title !== undefined || eyebrow !== undefined ? (
        <header className="mb-6">
          {eyebrow !== undefined ? <p className="text-caption text-ink-2">{eyebrow}</p> : null}
          {title !== undefined ? <h1 className="font-display text-title font-normal text-ink">{title}</h1> : null}
        </header>
      ) : null}
      <main className="flex flex-1 flex-col gap-4">{children}</main>
      {bottom !== undefined ? <div className="mt-8 flex flex-col gap-4">{bottom}</div> : null}
    </div>
  );
}
