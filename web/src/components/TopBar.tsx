import { createContext, useContext, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

/** The left side of the top row (the language switch is on the right). */
export const TopBarSlot = createContext<HTMLElement | null>(null);

/** Puts a very small link in the top row of every screen below it. */
export function TopBarStart({ children }: { children: ReactNode }) {
  const slot = useContext(TopBarSlot);
  return slot ? createPortal(children, slot) : null;
}
