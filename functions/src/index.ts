/**
 * Cloud Functions entry point: exports only (architecture.md Part 1).
 * Phase 0 has a single health check; real functions arrive from Phase 1.
 */
import { setGlobalOptions } from 'firebase-functions';
import { onCall } from 'firebase-functions/https';
import { REGION } from './config';
import { healthCheck } from './health';

setGlobalOptions({ region: REGION, maxInstances: 10 });

export const ping = onCall(() => healthCheck());
