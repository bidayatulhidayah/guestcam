import {
  isValidEventSlug,
  pickCurrentEvent,
  type ResolveCurrentEventRequest,
  type ResolveCurrentEventResponse,
} from '@guestcam/shared';
import { HttpsError, type CallableRequest } from 'firebase-functions/https';
import { buildEventView } from './eventView';
import { loadOpenEvents, loadSpaceByPublicId, memberEventIds } from './spaces';

const CODE_REQUIRED: ResolveCurrentEventResponse = { kind: 'codeRequired' };

/**
 * The event a member's phone should open for `/s/:publicId` (or a given
 * `eventSlug`). Callers who have not joined get `codeRequired` with no names,
 * title or theme (architecture.md Part 3, defence in depth).
 */
export async function resolveCurrentEvent(
  request: CallableRequest<ResolveCurrentEventRequest>,
): Promise<ResolveCurrentEventResponse> {
  const uid = request.auth?.uid;
  if (!uid) throw new HttpsError('unauthenticated', 'Sign in first');
  const input = request.data ?? ({} as ResolveCurrentEventRequest);
  if (typeof input.publicId !== 'string') return CODE_REQUIRED;

  const slug = typeof input.eventSlug === 'string' ? input.eventSlug.trim().toLowerCase() : null;
  if (slug && !isValidEventSlug(slug)) return CODE_REQUIRED;

  const space = await loadSpaceByPublicId(input.publicId);
  if (!space) return CODE_REQUIRED;

  const events = await loadOpenEvents(space.spaceId, slug);
  const joined = await memberEventIds(
    events.map((e) => e.eventId),
    uid,
  );
  const mine = events.filter((e) => joined.has(e.eventId));
  if (mine.length === 0) return CODE_REQUIRED;

  const currentId =
    pickCurrentEvent(
      mine.map(({ eventId, event }) => ({
        eventId,
        startMs: event.startAt.toMillis(),
        endMs: event.endAt.toMillis(),
        uploadUntilMs: event.uploadUntil.toMillis(),
      })),
      Date.now(),
    ) ??
    // None is current: open the most recently started event the guest joined.
    [...mine].sort((a, b) => b.event.startAt.toMillis() - a.event.startAt.toMillis())[0]?.eventId;

  const current = mine.find((e) => e.eventId === currentId);
  if (!current) return CODE_REQUIRED;
  return { kind: 'event', event: buildEventView(space.spaceId, space.space, current.eventId, current.event) };
}
