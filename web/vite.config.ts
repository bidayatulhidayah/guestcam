import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv, type HtmlTagDescriptor, type Plugin, type Rolldown } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import { APP_NAME, APP_SHORT_NAME } from './src/brand';
import { FUNCTIONS_REGION } from './src/lib/firebase/region';

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

/** The Firebase core chunk and the chunks it imports (`loadFirebase()` in lib/firebase/load.ts). */
function firebaseCoreFiles(bundle: Rolldown.OutputBundle): string[] {
  const chunks = Object.values(bundle).filter((output): output is Rolldown.OutputChunk => output.type === 'chunk');
  const core = chunks.find((chunk) => chunk.facadeModuleId?.replaceAll('\\', '/').endsWith('/src/lib/firebase/index.ts'));
  if (!core) throw new Error('first-load hints: Firebase core chunk not found; update firebaseCoreFiles()');
  const files = new Set<string>();
  const visit = (chunk: Rolldown.OutputChunk) => {
    if (files.has(chunk.fileName)) return;
    files.add(chunk.fileName);
    for (const name of chunk.imports) {
      const imported = bundle[name];
      if (imported?.type === 'chunk') visit(imported);
    }
  };
  visit(core);
  return [...files];
}

/**
 * First-load speed (performance budget: QR scan to name screen). Every guest
 * link needs the Firebase core, an anonymous sign-in and a callable, so:
 * - `src/boot.ts` is its own entry, loaded with an async script, so sign-in
 *   starts while the larger main code is still downloading (main.tsx imports
 *   it too, which keeps the dev server and any missed hint working);
 * - fetch the Firebase core chunks together with the main code, not after it runs;
 * - open the connections to the sign-in and functions servers while the code downloads.
 */
function firstLoadHints(projectId: string | undefined): Plugin {
  return {
    name: 'guestcam:first-load-hints',
    apply: 'build',
    transformIndexHtml: {
      order: 'post',
      handler(html, ctx) {
        if (!ctx.bundle) return html;
        const boot = Object.values(ctx.bundle).find((output) => output.type === 'chunk' && output.isEntry && output.name === 'boot');
        if (!boot) throw new Error('first-load hints: boot entry not found');
        const tags: HtmlTagDescriptor[] = [
          { tag: 'script', attrs: { type: 'module', async: true, crossorigin: true, src: `/${boot.fileName}` }, injectTo: 'head' },
          ...firebaseCoreFiles(ctx.bundle)
            .filter((file) => !html.includes(file))
            .map((file): HtmlTagDescriptor => ({ tag: 'link', attrs: { rel: 'modulepreload', crossorigin: true, href: `/${file}` }, injectTo: 'head' })),
        ];
        if (projectId) {
          for (const origin of ['https://identitytoolkit.googleapis.com', `https://${FUNCTIONS_REGION}-${projectId}.cloudfunctions.net`]) {
            tags.push({ tag: 'link', attrs: { rel: 'preconnect', href: origin, crossorigin: true }, injectTo: 'head-prepend' });
          }
        }
        return { html, tags };
      },
    },
  };
}

export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    tailwindcss(),
    appNameInHtml(),
    firstLoadHints(loadEnv(mode, fileURLToPath(new URL('.', import.meta.url)), 'VITE_').VITE_FIREBASE_PROJECT_ID),
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
        // App shell: hashed assets (including the Firebase chunks the guest app and
        // the upload queue need offline), fonts and icons. Admin chunks are fetched on demand.
        globPatterns: ['**/*.{js,css,html,woff2,svg,png}'],
        globIgnores: ['**/AdminPage-*.js', '**/LoginPage-*.js'],
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
    rolldownOptions: {
      input: {
        index: fileURLToPath(new URL('./index.html', import.meta.url)),
        boot: fileURLToPath(new URL('./src/boot.ts', import.meta.url)),
      },
      output: {
        codeSplitting: {
          // Dexie (upload queue) in its own chunk: by default the bundler puts its
          // shared CommonJS helpers in Dexie's chunk, so the first screen loaded
          // all of Dexie (~31 KB gzipped) just for those helpers.
          groups: [{ name: 'dexie', test: /[\\/]node_modules[\\/]dexie[\\/]/, includeDependenciesRecursively: false }],
        },
      },
    },
  },
}));
