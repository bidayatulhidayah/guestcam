/**
 * PHASE 0 ONLY: stand-ins for the server until `resolveSpace` and `joinEvent`
 * exist (Phase 1). They match `scripts/seed-dev.ts`. Not real ids or codes.
 */
/** Space #10001 (beta), event "tunang". */
export const DEV_PUBLIC_ID = '7k3qmxa';
export const DEV_EVENT_SLUG = 'tunang';
export const DEV_EVENT_CODE = 'k7q2';

/** Space #00000 (internal), alias booked for event "sanding". */
export const DEV_ALIAS = 'zaimhidayah';
export const DEV_ALIAS_EVENT_SLUG = 'sanding';
export const DEV_ALIAS_EVENT_CODE = 'm4p8';

/** Well-formed alias with no booking: shows the neutral inactive page. */
export const DEV_INACTIVE_ALIAS = 'majlislama';
export const DEV_ACTIVE_ALIASES: ReadonlySet<string> = new Set([DEV_ALIAS]);
