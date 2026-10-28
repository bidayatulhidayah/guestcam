import type { EventView } from '@guestcam/shared';
import { useTranslation } from 'react-i18next';

/**
 * Couple names in the display serif with the thin double rule from the
 * invitation card (design.md: the one decorative element), then the event title.
 */
export function CoupleHeader({ event }: { event: EventView }) {
  const { i18n } = useTranslation();
  const title = i18n.language === 'en' ? event.title.en : event.title.ms;
  return (
    <header className="mb-8 flex flex-col items-start gap-3">
      <h1 className="font-display text-names font-normal text-accent">{event.displayNames}</h1>
      <div aria-hidden="true" className="h-1.5 w-24 border-y border-line" />
      <p className="text-ink-2">{title}</p>
    </header>
  );
}
