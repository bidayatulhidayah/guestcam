# ADR-0007: Guest access through callable functions and server-only guest fields

- **Status:** Accepted
- **Date:** 2026-10-28
- **Deciders:** Hidayah
- **Related:** memory D-036, D-039, D-046, D-057 to D-061; ADR-0004; architecture.md Part 3 and pitfalls P1, P3

## Context

Phase 1a implements entry and identity. Three facts shape the data access:

- `spaces/{id}` holds `spaceNumber`, `plan` and `entitlements`. Firestore rules cannot hide single fields (pitfall P1), so any guest who can read the space doc sees all of it, and `spaceNumber` must never reach guests.
- The gallery unlocks on the guest's first upload (D-005). If the guest can write `galleryUnlocked`, the gallery lock can be bypassed (pitfall P3).
- A wrong event code must look identical for unknown spaces, unknown events and events the phone has not joined (D-036). Per-device limits are weak against anonymous accounts, and a venue shares one IP on its wifi.

## Options considered

| Option | Pros | Cons |
| --- | --- | --- |
| Guests read `spaces/{id}` directly | No function call | Leaks plan, space number and entitlements |
| Split the space into a public doc and a private doc | Direct reads | Two docs to keep in sync; still exposes the space doc structure |
| **Callables return a guest-safe `EventView`; rules check entitlements server-side with `get()`** | Nothing private leaves the server; one contract in `shared/` | A function call on first open (cached afterwards) |

## Decision

- `resolveCurrentEvent` and `joinEvent` return an `EventView`: event id and slug, title, couple names, merged theme, effective features (entitled AND enabled), gallery mode, upload deadline. No dates, venue, plan, space number or codes.
- Guests never read `spaces/*`, `publicIds/*`, `rateLimits/*` or `events/*/private/*`. Space owners read their space; event docs are readable by members and space owners.
- `joinEvent` matches the code against the slug's event, or across the space when there is no slug. Event codes are unique within a space. Wrong code, unknown event and unknown space all answer `wrongCode`.
- Wrong codes are limited per device (5, then 5 minutes), per IP (100 per 15 minutes, IP stored hashed) and per space (300 per hour locks code entry for that space for 15 minutes and writes `spaceCodeEntryLocked` to the audit log).
- `guests/{uid}`: created and updated only by that member with validated fields; `galleryUnlocked` and `firstUploadAt` are written only by the server (the upload trigger, Phase 1b).
- The guest app uses Firestore Lite for one-off reads and writes; the event view is cached on the phone and refreshed in the background.

## Amendment (2026-10-28, memory D-067)

The space-wide lock blocks only codes typed without an event slug (the plain code screen). QR links (slug + code) keep working during a lock, under the per-device and per-IP limits. Every wrong code still counts toward the space limit and writes the audit entry when it trips. Trade-off: a caller can always include a slug, so the space lock mainly stops guessing across all of a space's events; per-slug guessing is bounded by the device and IP limits, and App Check is added in Phase 5.

## Consequences

- Good: no private space field can reach a guest; the gallery lock cannot be set by the client; brute force is limited even across many anonymous accounts.
- Bad / costs: first open of an event needs a function call (cold start possible); a space-wide lock can block legitimate guests for 15 minutes if someone floods wrong codes. Hosts will need an "unlock code entry" action (Phase 4).
- Follow-up work: Phase 1b media rules check `entitlements` and `enabledFeatures` with `get()`; App Check (Phase 5) reduces abuse further.
