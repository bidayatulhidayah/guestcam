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

## 2026-10-27 01:00 — Switch to Node 24

- **Agent / model:** Claude Code (Claude Opus 5.5), VS Code extension, Windows
- **Version / branch:** v0.1 (unreleased) / `feat/phase-0-skeleton`
- **Phase:** Phase 0 (Setup), follow-up
- **Goal:** Hidayah asked to move from Node 22 to Node 24 everywhere, put the rules tests on the current Firebase SDK, record the decision, then open the Phase 0 PR. She also confirmed Firestore and Storage are in asia-southeast1.

### What changed and why
- `environment.yml` `nodejs=24`; `engines.node: "24"` in all five package.json files (root, shared, web, functions, rules-tests); `.nvmrc` 24; Functions runtime `nodejs24` in `firebase.json`; esbuild target `node24`.
- Rules tests moved to `@firebase/rules-unit-testing` 6 + `firebase` 13, the same SDK as the web app (D-052 superseded by D-055).
- Lock file regenerated under Node 24.22.1 / npm 11.19.1.
- memory.md: D-055, S-12, Runtime row, region confirmed; Node 22 vs 24 open question removed. new-computer.md: Node 24 note and upgrade steps. AGENTS.md and README: Node 24.

### Files touched
| File | Change |
| --- | --- |
| `environment.yml`, `.nvmrc`, `firebase.json` | modified: Node 24, `nodejs24` |
| `package.json`, `shared/package.json`, `web/package.json`, `functions/package.json`, `rules-tests/package.json`, `package-lock.json` | modified: engines 24, node24 build target, rules-test SDK 6/13 |
| `AGENTS.md`, `README.md`, `docs/setup/new-computer.md`, `docs/ai/memory.md`, `docs/ai/worklog.md` | modified |

### Commands run and results
| Command | Result |
| --- | --- |
| `conda env update -n guestcam -f <repo>/environment.yml --prune` (run by Hidayah) | Node v24.22.1. A first run from `C:\Users\User` did nothing because the yml was not in that folder |
| `npm install` (lock refresh) | firebase 13.1.0 and rules-unit-testing 6.0.0 everywhere; 0 vulnerabilities |
| `npm ci` | 659 packages, no engine warnings, 0 vulnerabilities |
| `npm test` | shared 34, web 7, rules 3: all passed |
| `npm run typecheck` | clean |
| `npm run build` | web first load 119 KB gzipped; functions bundle 3.3 KB (node24) |

### Decisions
- D-055: Node 24 everywhere, one Firebase SDK version (supersedes D-052).

### Problems, risks, open questions
- The first `npm ci` failed with EPERM because the Vite dev server Claude started in the previous session was still running and locking a native file. `TaskStop` on Windows stops only the shell wrapper, not the node/java child. Hidayah ended it manually. Claude will avoid leaving long-lived servers running on this machine.
- `npm test` again left the Firestore emulator (`java.exe`) on port 8080 after `emulators:exec`, so the Windows leak is not caused by Node 22. Still open in memory.md.

### Next steps
- [ ] Hidayah: review and squash-merge the Phase 0 PR
- [ ] Then: release v0.1 (changelog, `docs/versions/v0.1.md`, VERSION, package versions, tag, GitHub Release; no production deploy)

### Commits
- (this commit) chore: switch to Node 24 and the current Firebase SDK for rules tests

---

## 2026-10-27 00:30 — Phase 0 skeleton

- **Agent / model:** Claude Code (Claude Opus 5.5), VS Code extension, Windows
- **Version / branch:** v0.1 (unreleased) / `feat/phase-0-skeleton`
- **Phase:** Phase 0 (Setup)
- **Goal:** Empty but correctly structured skeleton that runs against the emulators, passes its tests and deploys to a Hosting preview channel (prompt `docs/ai/prompts/phase-0-setup.md`). Plan approved by Hidayah; footer owner "Hidayah"; push as we go.

### What changed and why
- **Monorepo:** npm workspaces `shared`, `web`, `functions`, `rules-tests`; strict base tsconfig; Node 22 pinned; `.gitattributes` for LF. `.gitignore` had a bare `lib/` rule that would have hidden `web/src/lib/`; narrowed to `/functions/lib/`.
- **shared/:** data model types (Space, SpaceHost, AliasBooking, Event, EventAccess, EventMember, Guest, Media + host-only MediaPrivateMeta, Wish, Folder, FolderAccess, FolderMember, Catalog, Purchase, BugReport, AuditLogEntry and enums), path builders with segment validation and `isOriginalPath` (M1), `parseEntry` (last hyphen, lowercase, reserved slugs; a valid code after a bad slug makes the entry invalid), `location.ts` (permanent `/s/:publicId` vs alias), per-plan limits, feature catalog with packages, `isFeatureAvailable` and `computeEntitlements`.
- **web/:** React 19, Vite 8, React Router, Tailwind 4. Tailwind's default palette is removed, so only token colours exist. Self-hosted Latin-subset fonts (56 KB). Button, Tile, Screen, LanguageToggle. i18next with Malay as the default. Placeholder pages for every route, each showing its name in both languages; `/` is a Phase 0 index of all pages. Footer with copyright, version `vA.B (commit)` and a Lapor Masalah placeholder. `/login` and `/admin` are lazy chunks.
- **Firebase:** `firebase.json` (Firestore, Storage, Functions on Node 22 in asia-southeast1, Hosting SPA rewrite, emulators), deny-all rules, Hosting headers (no-cache for HTML and `sw.js`, immutable for `/assets`). Functions: a `ping` callable, the `PUBLIC_BASE_URL` param, an esbuild bundle that includes the shared code, and the server storage adapter interface.
- **Dev wiring:** on the dev server the web app uses the emulators (demo project) and Anonymous Auth with one shared sign-in. Before that fix, StrictMode created two anonymous accounts. The SDK is a lazy chunk.
- **Storage adapter:** interface with the five operations; the Firebase stub rejects with "not implemented".
- **PWA:** app shell precached; updates applied at the next route change, `holdUpdates()` for capture screens.
- **Scripts and docs:** `scripts/seed-dev.ts` (spaces #00000 → #00001 → #10001, counter, catalog), env examples, AGENTS.md Commands, README, new-computer.md, CHANGELOG `[Unreleased]`.
- Moved the Firebase web config from `docs/setup/.env.local` (an untracked JS snippet) to `web/.env.local` as `VITE_FIREBASE_*` variables and deleted the old file. Neither file is committed.

### Files touched
| File | Change |
| --- | --- |
| `package.json`, `package-lock.json`, `tsconfig.base.json`, `.nvmrc`, `.gitattributes`, `.gitignore` | added/modified: workspaces, scripts, grpc override |
| `shared/**` | added: package, 6 modules, 4 test files |
| `web/**` | added: Vite app, styles and fonts, components, i18n, routes and pages, lib/firebase, lib/storage, lib/device/serviceWorker, icons, tests |
| `functions/**` | added: package, config, index, health, storage adapter interface |
| `rules-tests/**` | added: setup and deny-all tests |
| `firebase.json`, `.firebaserc`, `firestore.rules`, `storage.rules`, `firestore.indexes.json` | added |
| `scripts/seed-dev.ts`, `scripts/tsconfig.json` | added |
| `.env.example`, `web/.env.example`, `functions/.env.example` | added |
| `AGENTS.md`, `README.md`, `CHANGELOG.md`, `docs/setup/new-computer.md`, `docs/ai/memory.md`, `docs/ai/worklog.md` | modified |

### Commands run and results
| Command | Result |
| --- | --- |
| `npm run test:unit` | shared 34 passed, web 7 passed |
| `npm run test:rules` | 3 passed (Firestore + Storage deny-all) |
| `npm run typecheck` | clean (all workspaces + scripts) |
| `npm run build` (web) | first-load JS 119 KB gzipped, CSS 3 KB, fonts 56 KB; Firebase chunk 151 KB (lazy); 13 precache entries |
| `npm run seed` | 3 spaces, 3 events, counter and catalog written to the emulator; read back OK |
| Emulators (auth, firestore, storage, functions, hosting) | all start; `ping` returns `{"ok":true,"featureCount":16}` |
| Headless Chrome on the dev server | dev index shows "Emulator Firebase bersambung"; one anonymous sign-up |
| `npm run deploy:preview` | https://guestcam-2026--preview-s6g4gj5a.web.app (expires 2026-11-03); headers checked with curl; fonts and olive accent checked by screenshot at 390 px |

### Decisions
- D-047 to D-054 recorded in memory.md: shared as TS source with an esbuild functions bundle, demo project for emulators, brand.ts, lazy Firebase, update on navigation, rules-test SDK pins, grpc override, copyright owner.

### Problems, risks, open questions
- **Windows emulator leak:** `firebase emulators:exec`, and stopping `emulators:start`, left the Firestore emulator's `java.exe` running on port 8080, so later starts fail with "port taken". Three leftover emulator processes from this session were still running at the end (PIDs 38136, 3660, 29244/12684). Claude was not permitted to kill them. Close them in Task Manager before running `npm test`.
- **Node 22 vs Firebase JS SDK 13:** the SDK needs Node >= 24.12 when run in Node. The web app is unaffected; rules tests are pinned to SDK 12. Decide on Node 24 before Phase 1.
- `docs/product/spec.md` is still the placeholder; Phase 0 used AGENTS.md, architecture.md, design.md and memory.md.
- `firebase projects:list` showed the resource location as "Not specified"; confirm Firestore and Storage are in asia-southeast1.
- `npm run test:rules` prints a harmless Java NullPointerException from the storage rules runtime at shutdown.
- The first preview deploy attempt failed with a transient API error; the retry succeeded.
- The app icon is a placeholder (camera mark on olive) until the brand is final.

### Next steps
- [ ] Hidayah: close the leftover emulator processes, run `npm test`, open the preview link on a phone, then open a PR from `feat/phase-0-skeleton` to `main`
- [ ] Decide Node 22 vs 24
- [ ] Replace `docs/product/spec.md` with the real spec
- [ ] Ask for the v0.1 release when ready (VERSION bump, tag, release note)
- [ ] Phase 1: entry, name, selfie, Snapshot, Upload from Gallery, queue, privacy step, My Uploads

### Commits
- `3886f0e` chore: set up npm workspaces monorepo root
- `7278dec` feat(shared): add types, paths, entry parser, location, limits and feature catalog
- `5723774` feat(web): scaffold React + Vite app with design tokens and base components
- `5db0ec5` feat(i18n): add i18next with Malay default, English toggle and key parity test
- `434aa07` feat(web): add placeholder routes, config with buildPublicUrl and footer
- `efbf760` feat(firebase): add Firebase config, deny-all rules, functions and rules tests
- `2e4d8f7` feat(storage): add storage adapter interface with Firebase stub
- `8026c23` feat(firebase): connect the web app to the emulators in development
- `1080618` feat(pwa): precache the app shell and apply updates on the next screen change
- `a7f57b3` chore: add dev seed script, env examples and document commands
- (this commit) docs: record Phase 0 in changelog, memory and work log

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
