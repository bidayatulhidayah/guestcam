import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig, type Plugin } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import { APP_NAME, APP_SHORT_NAME } from './src/brand';

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8')) as {
  version: string;
};

/** "0.1.0" -> "0.1": the project uses A.B versions; npm needs three numbers. */
const appVersion = pkg.version.split('.').slice(0, 2).join('.');

function gitShortHash(): string {
  try {
    return execSync('git rev-parse --short HEAD', { stdio: ['ignore', 'pipe', 'ignore'] })
      .toString()
      .trim();
  } catch {
    return 'dev';
  }
}

function appNameInHtml(): Plugin {
  return {
    name: 'guestcam:app-name',
    transformIndexHtml: (html) => html.replaceAll('%APP_NAME%', APP_NAME),
  };
}

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    appNameInHtml(),
    VitePWA({
      // The app decides when to apply an update: at the next screen change,
      // never in the middle of a capture (pitfall A1). See lib/device/serviceWorker.ts.
      registerType: 'prompt',
      injectRegister: false,
      manifest: {
        name: APP_NAME,
        short_name: APP_SHORT_NAME,
        lang: 'ms',
        start_url: '/',
        display: 'standalone',
        // Same as --paper in tokens.css (the manifest cannot read CSS variables).
        background_color: '#F5EFE3',
        theme_color: '#F5EFE3',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // App shell: hashed assets, fonts and icons. Admin chunks are fetched on demand.
        // The Firebase chunk is unused by guests in Phase 0; precache it once Phase 1 needs it offline.
        globPatterns: ['**/*.{js,css,html,woff2,svg,png}'],
        globIgnores: ['**/AdminPage-*.js', '**/LoginPage-*.js', '**/firebase-*.js'],
        navigateFallback: 'index.html',
        // Firebase reserved URLs (/__/auth, /__/firebase) must reach the network.
        navigateFallbackDenylist: [/^\/__\//],
        cleanupOutdatedCaches: true,
      },
    }),
  ],
  define: {
    __APP_VERSION__: JSON.stringify(appVersion),
    __APP_COMMIT__: JSON.stringify(gitShortHash()),
  },
  optimizeDeps: {
    // Pre-bundle the lazily imported SDK so the dev server does not reload on first use.
    include: ['firebase/app', 'firebase/auth', 'firebase/firestore', 'firebase/storage'],
  },
  server: {
    host: true,
    port: 5173,
  },
  build: {
    target: 'es2022',
  },
});
