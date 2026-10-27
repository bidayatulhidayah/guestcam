/**
 * Cloud Functions entry point: exports only (architecture.md Part 1).
 * Export names are the deployed names; callables match `CALLABLES` in shared.
 */
import { setGlobalOptions } from 'firebase-functions';
import { onCall } from 'firebase-functions/https';
import { joinEvent as joinEventHandler } from './access/joinEvent';
import { resolveCurrentEvent as resolveCurrentEventHandler } from './access/resolveCurrentEvent';
import { REGION } from './config';
import { healthCheck } from './health';

setGlobalOptions({ region: REGION, maxInstances: 10 });

export const ping = onCall(() => healthCheck());
export const resolveCurrentEvent = onCall(resolveCurrentEventHandler);
export const joinEvent = onCall(joinEventHandler);
