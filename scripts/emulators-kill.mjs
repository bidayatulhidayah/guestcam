/**
 * Runs kill-emulators.ps1 on Windows; does nothing elsewhere (macOS, Linux CI),
 * where the emulators shut down cleanly. Extra arguments are passed through,
 * e.g. `npm run emulators:kill -- -DryRun`.
 */
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

if (process.platform !== 'win32') process.exit(0);

const script = fileURLToPath(new URL('./kill-emulators.ps1', import.meta.url));
const result = spawnSync(
  'powershell.exe',
  ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-File', script, ...process.argv.slice(2)],
  { stdio: 'inherit' },
);
process.exit(result.status ?? 1);
