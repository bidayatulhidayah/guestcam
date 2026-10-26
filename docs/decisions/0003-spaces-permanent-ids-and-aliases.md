# ADR-0003: Spaces, permanent IDs and time-limited aliases

- **Status:** Accepted
- **Date:** 2026-10-25
- **Deciders:** Hidayah
- **Related:** memory D-032 to D-035, D-038; supersedes S-06, S-07, S-08

## Context

One couple usually has several events (engagement, solemnization, reception, groom's reception) with different themes and guest lists. The founder wants a clean typed address during the event (`.../zaimhidayah`), printed QR codes that never break, and names that do not get used up forever. Couples with the same names exist, rarely with the same dates.

## Options considered

| Option | Pros | Cons |
| --- | --- | --- |
| Per-couple subdomain (`zaimhidayah.kenang.app`) | Looks clean | Firebase limit of 20 subdomains per domain; each subdomain is a separate browser origin, so guests lose their identity between QR and typed address; not possible on the free domain |
| Permanent slug, never released or quarantined | Stable | Common names get used up |
| Sequential public IDs | Simple to read | Enumerable; reveals business volume |
| **Random permanent ID + time-limited alias, path-based** | Clean name during the event, unbreakable QR codes, names reusable, one origin | Typed alias only works inside its window |

## Decision

- A **space** per couple holds separate **events**.
- Every space has a permanent random `publicId` (`/s/7k3qmx`) used in all printed QR codes, and an internal 5-digit `spaceNumber` never shown to guests (#00000 Zaim & Hidayah, #00001 demo, internal tests below #10000, #10000 reserved, real spaces from #10001).
- A clean **alias** (`/zaimhidayah`) is booked per event and active from 00:00 on the event day to 24 h after the event (earlier on request), then free for other spaces. Overlaps are resolved manually.
- Everything is path-based on one origin. The domain is a single setting; old domains keep serving.

## Consequences

- Good: QR codes work forever; clean address during the event; no subdomain limits; guest identity is stable.
- Bad: a guest typing the alias after its window sees an "inactive" page and must use the QR or "My events".
- Follow-up: `bookAlias` overlap checks; neutral inactive page; super-admin conflict view.
