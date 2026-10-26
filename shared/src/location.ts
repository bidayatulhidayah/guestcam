import { PUBLIC_ID_PATTERN, isReservedName } from './alphabet';

/** Alias: lowercase a-z and 0-9, 4-30 characters, not all digits, not reserved. */
export const ALIAS_NAME_PATTERN = /^[a-z0-9]{4,30}$/;

export type SpaceLocation =
  /** `/s/:publicId/...`: the permanent address printed on QR codes. */
  | { kind: 'permanent'; publicId: string; basePath: string; rest: string[] }
  /** `/:aliasName/...`: clean address, valid only inside a booked window (checked by the server). */
  | { kind: 'alias'; aliasName: string; basePath: string; rest: string[] }
  | { kind: 'invalid' };

export function isValidPublicId(publicId: string): boolean {
  return PUBLIC_ID_PATTERN.test(publicId);
}

export function isValidAliasName(name: string): boolean {
  return ALIAS_NAME_PATTERN.test(name) && !/^\d+$/.test(name) && !isReservedName(name);
}

/**
 * Tells a permanent space address from an alias, from a URL pathname.
 * Only checks the format; whether the space exists or the alias is active
 * is decided by the server.
 */
export function parseSpaceLocation(pathname: string): SpaceLocation {
  const segments = pathname
    .split('/')
    .filter((segment) => segment.length > 0)
    .map((segment) => segment.toLowerCase());

  const [first, second, ...others] = segments;
  if (first === undefined) return { kind: 'invalid' };

  if (first === 's') {
    if (second === undefined || !isValidPublicId(second)) return { kind: 'invalid' };
    return { kind: 'permanent', publicId: second, basePath: `/s/${second}`, rest: others };
  }

  if (!isValidAliasName(first)) return { kind: 'invalid' };
  return {
    kind: 'alias',
    aliasName: first,
    basePath: `/${first}`,
    rest: second === undefined ? [] : [second, ...others],
  };
}
