import { useState } from 'react';
import { Outlet } from 'react-router';
import { TopBarControls, TopBarSlot } from '../components/TopBar';
import { LanguageToggle, TextSizeToggle } from '../components/ui';
import { Footer } from './Footer';
import { useUpdateOnNavigation } from './useUpdateOnNavigation';

export function RootLayout() {
  useUpdateOnNavigation();
  const [topBarStart, setTopBarStart] = useState<HTMLElement | null>(null);
  const [controlsHidden, setControlsHidden] = useState(false);
  return (
    <div className="flex min-h-dvh flex-col">
      <div className="mx-auto flex w-full max-w-lg items-center justify-between gap-2 px-4 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <div ref={setTopBarStart} className="min-w-0" />
        {/* On every screen, so "Aa" and the language are one tap from the name screen and the menu. */}
        {controlsHidden ? null : (
          <div className="flex shrink-0 items-center gap-2">
            <TextSizeToggle />
            <LanguageToggle />
          </div>
        )}
      </div>
      <TopBarSlot.Provider value={topBarStart}>
        <TopBarControls.Provider value={setControlsHidden}>
          <div className="flex flex-1 flex-col">
            <Outlet />
          </div>
        </TopBarControls.Provider>
      </TopBarSlot.Provider>
      <Footer />
    </div>
  );
}
