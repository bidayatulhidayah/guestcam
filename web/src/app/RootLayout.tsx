import { Outlet } from 'react-router';
import { LanguageToggle } from '../components/ui';
import { Footer } from './Footer';
import { useUpdateOnNavigation } from './useUpdateOnNavigation';

export function RootLayout() {
  useUpdateOnNavigation();
  return (
    <div className="flex min-h-dvh flex-col">
      <div className="mx-auto flex w-full max-w-lg justify-end px-5 pt-[max(1rem,env(safe-area-inset-top))]">
        <LanguageToggle />
      </div>
      <div className="flex flex-1 flex-col">
        <Outlet />
      </div>
      <Footer />
    </div>
  );
}
