/**
 * JSON in localStorage, never throwing: private mode, full storage or blocked
 * site data simply behave as "nothing saved".
 */
const PREFIX = 'guestcam.';

export function readJson<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    return raw === null ? null : (JSON.parse(raw) as T);
  } catch {
    return null;
  }
}

export function writeJson(key: string, value: unknown): void {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    // Storage unavailable: the app keeps working from memory.
  }
}

export function removeJson(key: string): void {
  try {
    localStorage.removeItem(PREFIX + key);
  } catch {
    // Ignore.
  }
}
