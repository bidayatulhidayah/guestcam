import { useState } from 'react';
import { Outlet } from 'react-router';
import { TopBarSlot } from '../components/TopBar';
import { LanguageToggle } from '../components/ui';
import { Footer } from './Footer';
import { useUpdateOnNavigation } from './useUpdateOnNavigation';

export function RootLayout() {
  useUpdateOnNavigation();
  const [topBarStart, setTopBarStart] = useState<HTMLElement | null>(null);
  return (
    <div className="flex min-h-dvh flex-col">
      <div className="mx-auto flex w-full max-w-lg items-center justify-between gap-4 px-5 pt-[max(1rem,env(safe-area-inset-top))]">
        <div ref={setTopBarStart} className="min-w-0" />
        <LanguageToggle />
      </div>
      <TopBarSlot.Provider value={topBarStart}>
        <div className="flex flex-1 flex-col">
          <Outlet />
        </div>
      </TopBarSlot.Provider>
      <Footer />
    </div>
  );
}
