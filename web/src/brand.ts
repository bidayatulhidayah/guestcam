/**
 * The ONE place the product name lives (codename until the brand is final).
 * Kept free of `import.meta.env` so `vite.config.ts` can import it for the
 * page title and PWA manifest. UI text uses the `appName` i18n key.
 */
export const APP_NAME = 'guestcam';
export const APP_SHORT_NAME = 'guestcam';
