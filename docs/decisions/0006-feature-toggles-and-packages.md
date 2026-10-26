# ADR-0006: Feature toggles, packages and add-ons

- **Status:** Accepted
- **Date:** 2026-10-26
- **Deciders:** Hidayah
- **Related:** memory D-043, D-046; architecture.md Part 6

## Context

Couples want to choose which functions their guests get (some want photos only, others want everything), and the business needs prices that follow the functions chosen. Functions differ a lot in cost: video wishes and shared folders use far more storage and bandwidth than text wishes. One couple may also want different functions at different events (e.g. a quieter nikah, a full reception).

## Options considered

| Option | Pros | Cons |
| --- | --- | --- |
| Fixed tiers only, no per-event choice | Simple | Couples cannot hide functions they do not want |
| Host toggles only, single price | Flexible | Price does not follow cost; heavy users underpay |
| **Entitlements (paid, per space) AND toggles (per event)** | Pay for what you use; per-event control; one model for trials, packages and custom deals | More data and rules to test |

## Decision

- A function is available only when the space is **entitled** (package + add-ons; written only by the server or super admin) **and** the host has **enabled** it for that event.
- One feature catalog in `shared/src/features.ts` used by the app, functions and rules tests.
- Packages (proposed: Asas, Lengkap, Premium, Custom) and add-ons live in `catalog/current` as data, priced in sen, with a price snapshot stored on every purchase.
- Enforcement in UI, security rules and functions. Switching off or downgrading never deletes content; items captured before a switch-off may still upload for 24 h.
- Internal, demo and trial spaces are entitled to everything, within their plan limits.

## Consequences

- Good: flexible pricing, per-event control, and prices can change without a deploy or affecting past buyers.
- Bad: every capture rule now reads the space and event docs; more rules tests.
- Follow-up: host "Fungsi" settings screen (v0.5); pricing page and checkout after v1.0; final package contents and prices from the costing work.
