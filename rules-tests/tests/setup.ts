import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { initializeTestEnvironment, type RulesTestEnvironment } from '@firebase/rules-unit-testing';

/** Demo project: the emulators never touch real Firebase resources. */
export const PROJECT_ID = 'demo-guestcam';

const root = resolve(import.meta.dirname, '..', '..');

function hostAndPort(envName: string, fallbackPort: number): { host: string; port: number } {
  const value = process.env[envName];
  if (!value) return { host: '127.0.0.1', port: fallbackPort };
  const [host = '127.0.0.1', port = String(fallbackPort)] = value.split(':');
  return { host, port: Number(port) };
}

export async function createTestEnv(): Promise<RulesTestEnvironment> {
  return initializeTestEnvironment({
    projectId: PROJECT_ID,
    firestore: {
      rules: readFileSync(resolve(root, 'firestore.rules'), 'utf8'),
      ...hostAndPort('FIRESTORE_EMULATOR_HOST', 8080),
    },
    storage: {
      rules: readFileSync(resolve(root, 'storage.rules'), 'utf8'),
      ...hostAndPort('FIREBASE_STORAGE_EMULATOR_HOST', 9199),
    },
  });
}
