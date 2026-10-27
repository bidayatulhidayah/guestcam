import {
  collections,
  firestorePaths,
  lockRemainingMs,
  recordFailure,
  type AuditLogEntry,
  type RateLimit,
  type RateLimitPolicy,
  type RateLimitState,
} from '@guestcam/shared';
import { FieldValue, Timestamp, type DocumentReference } from 'firebase-admin/firestore';
import { db } from '../firebase';

export interface LimitKey {
  /** Document id in `rateLimits`, e.g. `device_<uid>`. */
  key: string;
  policy: RateLimitPolicy;
  /** Set for space keys: a lock is written to the audit log of this space. */
  spaceId?: string;
}

function toState(data: RateLimit | undefined): RateLimitState | null {
  if (!data) return null;
  return {
    failures: data.failures,
    windowStartedAtMs: data.windowStartedAt.toMillis(),
    lockedUntilMs: data.lockedUntil ? data.lockedUntil.toMillis() : null,
  };
}

function toDoc(state: RateLimitState): RateLimit {
  return {
    failures: state.failures,
    windowStartedAt: Timestamp.fromMillis(state.windowStartedAtMs),
    lockedUntil: state.lockedUntilMs === null ? null : Timestamp.fromMillis(state.lockedUntilMs),
  };
}

const refFor = (key: string) => db.doc(firestorePaths.rateLimit(key)) as DocumentReference<RateLimit>;

/** Longest remaining lock over these keys, in ms; 0 when entry is open. */
export async function remainingLockMs(keys: LimitKey[], nowMs: number): Promise<number> {
  const snaps = await db.getAll(...keys.map((k) => refFor(k.key)));
  return Math.max(0, ...snaps.map((snap) => lockRemainingMs(toState(snap.data() as RateLimit | undefined), nowMs)));
}

/**
 * Records one wrong attempt against every key in a transaction. Returns the
 * longest lock started by this attempt (0 if none). A space lock also writes
 * an audit log entry (AGENTS.md rule 15).
 */
export async function recordWrongAttempt(keys: LimitKey[], nowMs: number): Promise<number> {
  return db.runTransaction(async (tx) => {
    const refs = keys.map((k) => refFor(k.key));
    const snaps = await tx.getAll(...refs);
    let lockMs = 0;
    keys.forEach((limit, i) => {
      const ref = refs[i];
      if (!ref) return;
      const { state, lockedNow } = recordFailure(toState(snaps[i]?.data()), nowMs, limit.policy);
      tx.set(ref, toDoc(state));
      if (!lockedNow) return;
      lockMs = Math.max(lockMs, limit.policy.lockMs);
      if (limit.spaceId) {
        const entry: Omit<AuditLogEntry, 'at'> & { at: FieldValue } = {
          spaceId: limit.spaceId,
          eventId: null,
          uid: 'system',
          action: 'spaceCodeEntryLocked',
          target: limit.spaceId,
          details: { failures: state.failures, lockMinutes: limit.policy.lockMs / 60_000 },
          at: FieldValue.serverTimestamp(),
        };
        tx.set(db.collection(collections.auditLog).doc(), entry);
      }
    });
    return lockMs;
  });
}

/** A correct code clears the device's count (IP and space counts are shared, so they stay). */
export async function clearLimit(key: string): Promise<void> {
  await refFor(key).delete();
}
