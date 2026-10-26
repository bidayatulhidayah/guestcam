# ADR-0001: Record architecture decisions

- **Status:** Accepted
- **Date:** 2026-10-25
- **Deciders:** Hidayah
- **Related:** memory D-041

## Context

The project is built by one developer with AI coding assistants, and the AI tool or model may change (another vendor, or a local model). Decisions made in chat conversations are lost unless written down in the repo.

## Options considered

| Option | Pros | Cons |
| --- | --- | --- |
| Rely on chat history | No effort | Lost when switching tools; not reviewable |
| Decision log only (memory.md) | Quick | Little room for reasoning on big decisions |
| ADRs for big decisions + memory.md for all decisions + work log per session | Standard practice; full reasoning kept; any AI can resume | Some writing effort each session |

## Decision

Use ADRs in `docs/decisions/` for significant decisions, `docs/ai/memory.md` as the complete decision log and project context, and `docs/ai/worklog.md` for a per-session change log. `AGENTS.md` makes updating them mandatory for every AI session.

## Consequences

- Good: any developer or AI can understand why the system looks as it does; reviews are possible without reading diffs.
- Bad: each session ends with a few minutes of documentation.
- Follow-up: reviewers should reject AI work that skips the work log entry.
