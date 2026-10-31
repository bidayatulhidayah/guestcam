import { registerSW } from 'virtual:pwa-register';

/**
 * Service worker updates (pitfall A1): a new version is downloaded in the
 * background and applied by reloading, but only at a safe moment:
 * - at the next screen change, or
 * - when the guest comes back to the app while on a screen that allows it (the menu),
 * and never while something only lives in this page's memory (a gallery pick
 * not sent yet, a capture kept in memory because storage was full), while a
 * screen holds updates (`holdUpdates`), or mid-capture.
 *
 * An open page also looks for a new version when the guest comes back to it,
 * so a fix deployed on the event day reaches guests who keep the menu open.
 */
const RETURN_DELAY_MS = 5_000;
const UPDATE_CHECK_INTERVAL_MS = 30 * 60_000;

let updatePending = false;
let held = false;
let updateOnReturn = false;
let reloadGuard: () => boolean = () => true;
let applyUpdate: ((reload?: boolean) => Promise<void>) | undefined;
let registration: ServiceWorkerRegistration | undefined;
let lastCheckMs = Date.now();
let returnTimer: ReturnType<typeof setTimeout> | undefined;

export function startServiceWorker(): void {
  if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return;
  applyUpdate = registerSW({
    onNeedRefresh() {
      updatePending = true;
    },
    onRegisteredSW(_url, swRegistration) {
      registration = swRegistration;
    },
  });
  document.addEventListener('visibilitychange', onVisibilityChange);
}

function onVisibilityChange(): void {
  clearTimeout(returnTimer);
  if (document.visibilityState !== 'visible') return;
  if (registration && Date.now() - lastCheckMs > UPDATE_CHECK_INTERVAL_MS) {
    lastCheckMs = Date.now();
    void registration.update().catch(() => undefined);
  }
  // Wait a moment: coming back from the camera, the photo is saved first (holdUpdates).
  if (updateOnReturn) returnTimer = setTimeout(applyPendingUpdate, RETURN_DELAY_MS);
}

/** A screen that is busy (e.g. saving a capture, asking a question about a selection). */
export function holdUpdates(hold: boolean): void {
  held = hold;
}

/** Screens where coming back to the app may reload into a new version (the menu). */
export function allowUpdateOnReturn(allow: boolean): void {
  updateOnReturn = allow;
  if (!allow) clearTimeout(returnTimer);
}

/** The upload queue reports whether a reload would lose anything (files held only in memory). */
export function setReloadGuard(guard: () => boolean): void {
  reloadGuard = guard;
}

/** Called on every route change and on return to the app: reloads into the new version if one is waiting. */
export function applyPendingUpdate(): void {
  if (updatePending && !held && applyUpdate && reloadGuard()) {
    updatePending = false;
    void applyUpdate(true);
  }
}
