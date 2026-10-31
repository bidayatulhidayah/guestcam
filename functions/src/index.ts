/**
 * Cloud Functions entry point: exports only (architecture.md Part 1).
 * Export names are the deployed names; callables match `CALLABLES` in shared.
 */
import type { Media } from '@guestcam/shared';
import { setGlobalOptions } from 'firebase-functions';
import { onDocumentDeleted } from 'firebase-functions/firestore';
import { onCall } from 'firebase-functions/https';
import { onObjectFinalized } from 'firebase-functions/storage';
import { joinEvent as joinEventHandler } from './access/joinEvent';
import { resolveCurrentEvent as resolveCurrentEventHandler } from './access/resolveCurrentEvent';
import { REGION } from './config';
import { healthCheck } from './health';
import { handleMediaDeleted } from './triggers/onMediaDeleted';
import { handleOriginalUploaded } from './triggers/onOriginalUploaded';

setGlobalOptions({ region: REGION, maxInstances: 10 });

export const ping = onCall(() => healthCheck());
export const resolveCurrentEvent = onCall(resolveCurrentEventHandler);
export const joinEvent = onCall(joinEventHandler);

/** The default bucket is in asia-southeast1, the same region as the function. */
export const onOriginalUploaded = onObjectFinalized({ retry: true }, async (event) => {
  await handleOriginalUploaded(event.data);
});

export const onMediaDeleted = onDocumentDeleted({ document: 'events/{eventId}/media/{mediaId}', retry: true }, async (event) => {
  await handleMediaDeleted(event.params.eventId, event.params.mediaId, event.data?.data() as Media | undefined);
});
