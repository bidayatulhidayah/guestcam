import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig, type Plugin } from 'vite';
import { APP_NAME } from './src/brand';

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
  plugins: [react(), tailwindcss(), appNameInHtml()],
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
