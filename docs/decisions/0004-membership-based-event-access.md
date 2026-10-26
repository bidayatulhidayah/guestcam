# ADR-0004: Membership-based event access and privacy

- **Status:** Accepted
- **Date:** 2026-10-25
- **Deciders:** Hidayah
- **Related:** memory D-005, D-006, D-017, D-036, D-037, D-039; architecture pitfalls P1-P5

## Context

Guests share photos of other people at private family events. A design review found that Firestore security rules cannot hide individual fields (so GPS in a readable document leaks), that guest names could be traced through IDs, and that a gallery lock enforced only in the app can be bypassed by querying the database directly.

## Options considered

| Option | Pros | Cons |
| --- | --- | --- |
| Check the event code in the browser | Simple | Bypassable; code must be readable |
| Event code in security rules | No server code | Code readable by whoever can evaluate it |
| **Server function checks the code and writes a membership record; rules allow reads only to members and hosts** | Codes never leave the server; rate limiting possible; rules stay simple | Needs a callable function |

## Decision

- `joinEvent` (server) checks the per-event code with rate limiting and writes `events/{id}/members/{uid}`. Codes live only in `events/{id}/private/access`.
- Security rules allow event reads only to members and hosts; the gallery lock and reveal time are enforced in rules.
- Location and raw EXIF live in `media/{id}/private/meta` (hosts only). Media docs carry only `ownerUid`; guest names appear only when the guest chose to show them.
- Default visibility is private. Hosts are per-space owners (each partner separately) or moderators; every host action is audited.

## Consequences

- Good: privacy holds even if someone bypasses the app; codes cannot be extracted.
- Bad: every rule change needs emulator tests (required by AGENTS.md rule 13).
- Follow-up: rules test suite covering members, hosts, private items, location, lock and reveal.
