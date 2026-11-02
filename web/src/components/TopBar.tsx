import { createContext, useContext, useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

/** The left side of the top row (the language switch is on the right). */
export const TopBarSlot = createContext<HTMLElement | null>(null);

/** Puts a very small link in the top row of every screen below it. */
export function TopBarStart({ children }: { children: ReactNode }) {
  const slot = useContext(TopBarSlot);
  return slot ? createPortal(children, slot) : null;
}

/** Hides the top row's "Aa" and language buttons while a screen asks for it. */
export const TopBarControls = createContext<(hidden: boolean) => void>(() => undefined);

/** A screen with its own clean header (My Uploads, D-093): no "Aa" / language buttons while it shows. */
export function useHideTopBarControls(): void {
  const setHidden = useContext(TopBarControls);
  useEffect(() => {
    setHidden(true);
    return () => setHidden(false);
  }, [setHidden]);
}
