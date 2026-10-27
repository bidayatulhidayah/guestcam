import { createHash } from 'node:crypto';

interface RequestLike {
  ip?: string | undefined;
  headers: Record<string, string | string[] | undefined>;
}

/**
 * Caller IP for rate limiting. Google's front end appends the real client IP
 * as the LAST `X-Forwarded-For` entry, after anything the client sent itself,
 * so earlier entries are ignored.
 */
export function clientIp(request: RequestLike): string {
  const header = request.headers['x-forwarded-for'];
  const value = Array.isArray(header) ? header.join(',') : header;
  const last = value
    ?.split(',')
    .map((part) => part.trim())
    .filter(Boolean)
    .at(-1);
  return last || request.ip || 'unknown';
}

/** IPs are stored only as a hash. */
export function hashIp(ip: string): string {
  return createHash('sha256').update(ip).digest('hex').slice(0, 32);
}
