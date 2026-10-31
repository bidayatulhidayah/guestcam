/**
 * First-load speed (performance budget: QR scan to name screen). A tiny entry
 * that runs before the main app code has finished downloading: it starts the
 * Firebase core and, on a space link, the guest's anonymous sign-in, so that
 * network wait overlaps with loading the app instead of following it.
 */
import { loadFirebase } from './lib/firebase/load';

void loadFirebase()
  .then(({ ensureAnonymousUser }) => {
    if (window.location.pathname.startsWith('/s/')) void ensureAnonymousUser().catch(() => undefined);
  })
  .catch(() => undefined);
