import { CODE_ALPHABET } from './alphabet';
import { isValidEventCode } from './entry';

/** Source of random bytes: `crypto.getRandomValues` in browsers, `randomBytes` in Node. */
export type RandomBytes = (length: number) => Uint8Array;

/** Uniform random string from the code alphabet (rejection sampling, no modulo bias). */
export function randomFromAlphabet(length: number, randomBytes: RandomBytes): string {
  const alphabetSize = CODE_ALPHABET.length;
  const limit = 256 - (256 % alphabetSize);
  let result = '';
  while (result.length < length) {
    for (const byte of randomBytes(length * 2)) {
      if (byte < limit && result.length < length) result += CODE_ALPHABET[byte % alphabetSize];
    }
  }
  return result;
}

/** Permanent space link id: 7 characters (`/s/:publicId`). Uniqueness is checked by `publicIds/{id}`. */
export function generatePublicId(randomBytes: RandomBytes): string {
  return randomFromAlphabet(7, randomBytes);
}

/**
 * New 4-character event code that is not already used in the same space.
 * Codes must be unique within a space: `joinEvent` without a slug matches a
 * code across all of the space's events.
 */
export function generateEventCode(existingCodesInSpace: Iterable<string>, randomBytes: RandomBytes): string {
  const taken = new Set([...existingCodesInSpace].map((code) => code.toLowerCase()));
  for (let attempt = 0; attempt < 1000; attempt++) {
    const code = randomFromAlphabet(4, randomBytes);
    if (!taken.has(code)) return code;
  }
  throw new Error('Could not find a free event code in this space');
}

/** Lowercases and checks a typed or scanned code; returns null if it can never be valid. */
export function normalizeEventCode(input: string): string | null {
  const code = input.trim().toLowerCase();
  return isValidEventCode(code) ? code : null;
}
