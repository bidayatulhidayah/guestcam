# AI work log

Every AI session (Claude Code, another assistant, or a local model) adds ONE entry at the TOP of this log before its final commit. Humans review the project through this file, so write for someone who has not seen the diff.

Rules:
- Newest entry first. Never edit or delete old entries; add a correction entry instead.
- Times in Asia/Kuala_Lumpur (UTC+08:00).
- No secrets, keys, event codes or guest personal data.
- Link decisions to `docs/ai/memory.md` (D-numbers) and ADRs where relevant.

---

## Entry template

```markdown
## YYYY-MM-DD HH:MM — <short title>

- **Agent / model:** e.g. Claude Code (Claude Opus 5.5)
- **Version / branch:** vA.B (unreleased) / feat/...
- **Phase:** e.g. Phase 1
- **Goal:** what the human asked for, in one or two sentences

### What changed and why
- ...

### Files touched
| File | Change |
| --- | --- |
| path | added / modified / deleted: what |

### Commands run and results
| Command | Result |
| --- | --- |
| `npm test` | 42 passed, 0 failed |

### Decisions
- D-0xx: ... (also recorded in memory.md)

### Problems, risks, open questions
- ...

### Next steps
- [ ] ...

### Commits
- `abc1234` feat(queue): ...
```

---

## 2026-10-26 21:40 — Feature toggles, packages and add-ons

- **Agent / model:** Claude (Opus 5.5) in claude.ai chat, planning session with Hidayah
- **Version / branch:** v0.0 + unreleased docs / none yet
- **Phase:** Planning (toggles in v0.5, checkout after v1.0)
- **Goal:** Let the couple or admin choose which functions guests get, with pricing depending on the functions chosen.

### What changed and why
- Two-layer model: entitled (package + add-ons, server-written) AND enabled (host toggle per event). Guests see only effective features; menu reflows.
- Feature catalog of 16 keys in `shared/src/features.ts`; proposed packages Asas / Lengkap / Premium / Custom plus add-ons; prices as data with per-purchase snapshots.
- Enforcement in UI, security rules and functions; 24 h grace for items captured before a feature is switched off; content never deleted on downgrade.
- Folder direct link recorded as a proposed feature (`folderDirectLink`, off by default) pending the founder's decision.

### Files touched
| File | Change |
| --- | --- |
| `docs/architecture/architecture.md` | added Part 6 (catalog, packages, data model, enforcement, pitfalls T1-T5) |
| `AGENTS.md` | rule 17 (feature toggles); shared/ now holds the features catalog |
| `docs/decisions/0006-feature-toggles-and-packages.md`, `docs/decisions/README.md` | added ADR-0006 |
| `docs/ai/memory.md` | D-046; open questions (direct link, package contents and prices) |
| `docs/ai/prompts/phase-0-setup.md` | `features.ts`, catalog types and `isFeatureAvailable` helper in Phase 0 |
| `docs/product/design.md` | menu reflows when tiles are switched off |
| `docs/versions/VERSIONING.md`, `README.md`, `CHANGELOG.md`, `docs/README.md` | roadmap, feature list, Unreleased, index |

### Commands run and results
| Command | Result |
| --- | --- |
| none (documentation only) | |

### Decisions
- D-046 (memory.md, ADR-0006).

### Problems, risks, open questions
- Package contents and prices not final (costing chat).
- Folder direct link awaiting decision.

### Next steps
- [ ] Hidayah: confirm package contents; decide on folder direct link.
- [ ] Continue setup, then Phase 0.

### Commits
- (to be committed by Hidayah: `docs: design feature toggles and packages`)

---

## 2026-10-26 21:30 — Shared folders design (Folder Kongsi)

- **Agent / model:** Claude (Opus 5.5) in claude.ai chat, planning session with Hidayah
- **Version / branch:** v0.0 + unreleased docs / none yet
- **Phase:** Planning (feature targeted for v0.4, Phase 3)
- **Goal:** Let guests create a folder and upload many photos so they no longer need AirDrop, with the folder private to the couple and anyone holding the folder PIN.

### What changed and why
- Designed shared folders: create, auto-generated 6-digit PIN, link + PIN sharing, contributors, ZIP for owners and creator, PIN reset with optional removal, host Folders tab, export keeps folder structure.
- Chose a subcollection per folder (`events/{e}/folders/{f}/media`) so privacy is enforced by path and gallery queries can never include folder items.
- Added brute-force protection (three rate limits, lockout, App Check) and re-pick deduplication for large batches.
- Menu grows to eight tiles (Shared Folder added).

### Files touched
| File | Change |
| --- | --- |
| `docs/architecture/architecture.md` | added Part 5: behaviour, data model, functions, rules, pitfalls F1-F6 |
| `AGENTS.md` | folder route; rule 15 extended; new rule 16 (folder privacy) |
| `docs/decisions/0005-shared-folders-with-pin.md`, `docs/decisions/README.md` | added ADR-0005 |
| `docs/ai/memory.md` | D-045 added; D-007 superseded (S-11); open question; glossary |
| `docs/product/design.md` | menu now seven tiles + Galeri; folder icon to custom-draw |
| `docs/versions/VERSIONING.md` | v0.4 roadmap includes shared folders |
| `docs/ai/prompts/phase-0-setup.md` | `Folder`, `FolderMember` types in Phase 0 |
| `README.md`, `CHANGELOG.md` | feature listed; `[Unreleased]` entry |

### Commands run and results
| Command | Result |
| --- | --- |
| none (documentation only) | |

### Decisions
- D-045: shared folders (see memory.md and ADR-0005).

### Problems, risks, open questions
- Firestore list queries plus `exists()` checks on member docs must be covered by rules tests before release.
- Open: ZIP download for non-creator PIN holders (v1: no); moving folder items to the public gallery (v1: no).

### Next steps
- [ ] Hidayah: continue `docs/setup/start-here.md`, then Phase 0.

### Commits
- (to be committed by Hidayah: `docs: design shared folders (Folder Kongsi)`)

---

## 2026-10-25 03:15 — Planning baseline and repo structure (v0.0)

- **Agent / model:** Claude (Opus 5.5) in claude.ai chat, planning session with Hidayah
- **Version / branch:** v0.0 / none yet (repo not created)
- **Phase:** Planning
- **Goal:** Plan the guest camera web app end to end and prepare a documented repo starter before writing code.

### What changed and why
- Defined the product (features, flows, privacy, metadata, multi-event spaces) and recorded it in the planning doc (exported to `docs/product/spec.md`).
- Researched commercial competitors (POV, Once, Lense, GuestPix, Wedibox, and others) and Firebase, Supabase and Cloudflare R2 pricing; produced a cost estimate for 1,000 guests.
- Chose the stack (React + Vite + TypeScript PWA, Firebase in asia-southeast1, conda environment) and wrote the AI rules (`AGENTS.md`).
- Reviewed the design for bugs before coding and wrote 40 known pitfalls with fixes (`docs/architecture/architecture.md`). Several fixed real design flaws: location leakage through Firestore rules, guest-name leakage, unparseable route, duplicate uploads.
- Set up versioning (`A.B`), changelog, release note template, ADRs, AI memory and this work log so any AI can resume.

### Files touched
| File | Change |
| --- | --- |
| `README.md`, `AGENTS.md`, `CLAUDE.md`, `VERSION`, `CHANGELOG.md`, `LICENSE`, `.gitignore` | added |
| `environment.yml` | added: conda env (Node 22, Java 21, ffmpeg, git, gh, Python, locust) |
| `docs/**` | added: product, architecture, decisions, versions, ai, setup |

### Commands run and results
| Command | Result |
| --- | --- |
| Colour contrast checks (Python) | All text pairs pass WCAG AA; brass decorative only |

### Decisions
- D-001 to D-044 and superseded S-01 to S-10 recorded in `docs/ai/memory.md`; ADR-0001 to ADR-0004 in `docs/decisions/`.

### Problems, risks, open questions
- Product name not final (working name Kenang; codename guestcam).
- Copyright owner line for the footer not decided.
- `docs/product/spec.md` must be exported by hand from the planning doc.

### Next steps
- [ ] Hidayah: finish `docs/setup/start-here.md` (accounts, conda env, Firebase project, GitHub repo).
- [ ] Run Phase 0 with `docs/ai/prompts/phase-0-setup.md`.

### Commits
- (first commit to be made by Hidayah: `docs: add project documentation baseline`)
