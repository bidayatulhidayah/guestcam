import { timingSafeEqual } from 'node:crypto';
import {
  EVENT_CODE_RATE_LIMITS,
  firestorePaths,
  isValidEventSlug,
  normalizeEventCode,
  type EventMember,
  type JoinEventRequest,
  type JoinEventResponse,
} from '@guestcam/shared';
import { FieldValue } from 'firebase-admin/firestore';
import { HttpsError, type CallableRequest } from 'firebase-functions/https';
import { db } from '../firebase';
import { clientIp, hashIp } from './clientIp';
import { buildEventView } from './eventView';
import { clearLimit, recordWrongAttempt, remainingLockMs, type LimitKey } from './rateLimits';
import { loadEventAccess, loadOpenEvents, loadSpaceByPublicId, type LoadedEvent } from './spaces';

function sameCode(a: string, b: string): boolean {
  const left = Buffer.from(a.toLowerCase());
  const right = Buffer.from(b.toLowerCase());
  return left.length === right.length && timingSafeEqual(left, right);
}

/**
 * Checks an event code and makes the caller a member (D-036).
 * Wrong code, unknown event and unknown space all answer `wrongCode`.
 * Limits: per device, per IP and per space (EVENT_CODE_RATE_LIMITS).
 */
export async function joinEvent(request: CallableRequest<JoinEventRequest>): Promise<JoinEventResponse> {
  const uid = request.auth?.uid;
  if (!uid) throw new HttpsError('unauthenticated', 'Sign in first');
  const input = request.data ?? ({} as JoinEventRequest);
  const nowMs = Date.now();

  const space = typeof input.publicId === 'string' ? await loadSpaceByPublicId(input.publicId) : null;
  const keys: LimitKey[] = [
    { key: `device_${uid}`, policy: EVENT_CODE_RATE_LIMITS.device },
    { key: `ip_${hashIp(clientIp(request.rawRequest))}`, policy: EVENT_CODE_RATE_LIMITS.ip },
  ];
  if (space) keys.push({ key: `space_${space.spaceId}`, policy: EVENT_CODE_RATE_LIMITS.space, spaceId: space.spaceId });

  const locked = await remainingLockMs(keys, nowMs);
  if (locked > 0) return { kind: 'tooManyTries', retryAfterMs: locked };

  const code = typeof input.code === 'string' ? normalizeEventCode(input.code) : null;
  const slug = typeof input.eventSlug === 'string' ? input.eventSlug.trim().toLowerCase() : null;
  const slugOk = slug === null || slug === '' || isValidEventSlug(slug);

  let match: LoadedEvent | undefined;
  let linkedEventIds: string[] = [];
  if (space && code && slugOk) {
    const events = await loadOpenEvents(space.spaceId, slug || null);
    const access = await loadEventAccess(events.map((e) => e.eventId));
    // Codes are unique within a space, so at most one event matches.
    match = events.find((e) => {
      const stored = access.get(e.eventId)?.code;
      return stored !== undefined && sameCode(stored, code);
    });
    if (match) linkedEventIds = access.get(match.eventId)?.linkedEventIds ?? [];
  }

  if (!space || !match) {
    const lockMs = await recordWrongAttempt(keys, nowMs);
    return lockMs > 0 ? { kind: 'tooManyTries', retryAfterMs: lockMs } : { kind: 'wrongCode' };
  }

  // The matched event plus linked events of the same space (an explicit host choice).
  const linked =
    linkedEventIds.length > 0
      ? (await loadOpenEvents(space.spaceId)).filter((e) => linkedEventIds.includes(e.eventId))
      : [];
  const targets: { eventId: string; via: EventMember['via'] }[] = [
    { eventId: match.eventId, via: 'code' },
    ...linked.map((e) => ({ eventId: e.eventId, via: 'linkedEvent' as const })),
  ];
  const refs = targets.map((t) => db.doc(firestorePaths.eventMember(t.eventId, uid)));
  const existing = await db.getAll(...refs);
  const batch = db.batch();
  targets.forEach((target, i) => {
    const ref = refs[i];
    // Joining again keeps the original joinedAt.
    if (ref && !existing[i]?.exists) batch.set(ref, { joinedAt: FieldValue.serverTimestamp(), via: target.via });
  });
  await batch.commit();
  await clearLimit(`device_${uid}`);

  return { kind: 'joined', event: buildEventView(space.spaceId, space.space, match.eventId, match.event) };
}
