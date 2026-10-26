import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router';
import { applyPendingUpdate } from '../lib/device/serviceWorker';

/** Applies a waiting app update when the guest moves to another screen. */
export function useUpdateOnNavigation(): void {
  const { pathname } = useLocation();
  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    applyPendingUpdate();
  }, [pathname]);
}
