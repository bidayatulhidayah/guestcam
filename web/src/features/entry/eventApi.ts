/**
 * Calls to the access functions. Loaded lazily (it pulls in the Firebase core
 * chunk), so import it with `import('./eventApi')`.
 */
import {
  CALLABLES,
  type JoinEventRequest,
  type JoinEventResponse,
  type ResolveCurrentEventRequest,
  type ResolveCurrentEventResponse,
} from '@guestcam/shared';
import { loadFirebase } from '../../lib/firebase/load';
import { rememberEvent } from './eventStore';

export async function resolveEvent(request: ResolveCurrentEventRequest): Promise<ResolveCurrentEventResponse> {
  const { callFunction } = await loadFirebase();
  const result = await callFunction<ResolveCurrentEventRequest, ResolveCurrentEventResponse>(
    CALLABLES.resolveCurrentEvent,
    request,
  );
  if (result.kind === 'event') rememberEvent(result.event);
  return result;
}

export async function joinEvent(request: JoinEventRequest): Promise<JoinEventResponse> {
  const { callFunction } = await loadFirebase();
  const result = await callFunction<JoinEventRequest, JoinEventResponse>(CALLABLES.joinEvent, request);
  if (result.kind === 'joined') rememberEvent(result.event);
  return result;
}
