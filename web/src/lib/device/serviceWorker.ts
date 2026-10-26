import { registerSW } from 'virtual:pwa-register';

/**
 * Service worker updates (pitfall A1): a new version is downloaded in the
 * background and applied at the next screen change, never mid-screen.
 * Capture screens (Phase 1+) must call `holdUpdates(true)` while recording.
 */
let updatePending = false;
let held = false;
let applyUpdate: ((reload?: boolean) => Promise<void>) | undefined;

export function startServiceWorker(): void {
  if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return;
  applyUpdate = registerSW({
    onNeedRefresh() {
      updatePending = true;
    },
  });
}

export function holdUpdates(hold: boolean): void {
  held = hold;
}

/** Called on every route change: reloads into the new version if one is waiting. */
export function applyPendingUpdate(): void {
  if (updatePending && !held && applyUpdate) {
    updatePending = false;
    void applyUpdate(true);
  }
}
