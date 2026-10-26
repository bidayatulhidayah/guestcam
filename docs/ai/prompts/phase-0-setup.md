# Phase 0 kickoff prompt for Claude Code

Paste everything between the lines into Claude Code, from the repo root, after finishing `docs/setup/start-here.md` steps 1-5.

---

Read AGENTS.md, docs/ai/memory.md, docs/product/spec.md, docs/product/design.md and docs/architecture/architecture.md (including Part 3, multi-event spaces). We are starting Phase 0 (Setup) only. Do not build any guest features yet.

Goal: an empty but correctly structured skeleton that runs locally against the Firebase emulators, passes its tests, and deploys to a Hosting preview channel I can open on my phone.

Tasks:
1. **Monorepo:** root `package.json` with npm workspaces `shared`, `web`, `functions`. TypeScript strict everywhere. `"engines": {"node": "22"}`.
2. **shared/:** `types.ts` (Space with `spaceNumber` and `plan`, SpaceHost, AliasBooking, Event, EventMember, Folder, FolderMember, Catalog, Package, Entitlements, Guest, Media, Wish, BugReport, AuditLogEntry and their enums, following architecture.md Part 3 and the corrections in Part 2), `paths.ts` (Firestore and storage path builders), `limits.ts`, and `entry.ts` with `parseEntry()` exactly as described in AGENTS.md (Spaces, events and routes). Unit tests for `parseEntry`: hyphenated slugs, uppercase codes, invalid codes, reserved slugs.
3. **web/:** React + Vite + TypeScript, Tailwind, React Router, vite-plugin-pwa. Folder structure from architecture.md Part 1 (empty feature folders are fine).
4. **Design tokens:** `styles/tokens.css` with the CSS variables from design.md, mapped into Tailwind; self-hosted Atkinson Hyperlegible and Instrument Serif (subset woff2, `font-display: swap`). Base `Button`, `Tile` and `Screen` components following design.md. No hard-coded hex in components.
5. **i18n:** i18next with `ms.json` (default) and `en.json`, `appName` key, EN/BM toggle. A test that fails if the two files have different keys.
6. **Routes as placeholder pages:** `/s/:publicId` and `/:aliasName` (both resolve to a placeholder "current event" page), `.../:eventEntry` (shows parsed event slug + code, or the code-screen placeholder), `.../:eventSlug/gallery`, `/mine`, `/login`, `/admin` (lazy-loaded chunk), and the neutral "alias inactive" page. Add `shared/src/location.ts` that tells a permanent `/s/:publicId` path (7 chars from the code alphabet) from an alias, with unit tests (reserved names, invalid ids, all-digit aliases rejected). Add a `scripts/seed-dev.ts` for the emulator that creates space `00000` (plan `internal`, alias `zaimhidayah`, display names "Zaim & Hidayah") first, then demo space `00001` (plan `demo`), then a test space `10001` (plan `beta`) with one engagement event. `shared/src/limits.ts` holds the per-plan limits table from architecture.md Part 4, and `shared/src/features.ts` the feature catalog and package contents from Part 6, with a helper `isFeatureAvailable(entitlements, enabledFeatures, key)` and unit tests. Seed spaces get `entitlements` for every feature. Add `web/src/config.ts` reading `VITE_PUBLIC_BASE_URL` and a `buildPublicUrl()` helper; no domain hard-coded anywhere. Each page shows its name in both languages. All code names in English.
7. **Footer:** "© 2026 [owner]. Hak cipta terpelihara." from config, app version, and a "Lapor Masalah" button placeholder.
8. **Firebase:** Firestore, Storage, Functions (TypeScript, Node 22, region asia-southeast1), Hosting with SPA rewrite (static files served first), Emulators. Deny-all rules to start.
9. **rules-tests/:** set up `@firebase/rules-unit-testing` with one passing test proving deny-all works.
10. **Storage adapter stub:** `web/src/lib/storage/` interface from AGENTS.md rule 9, with a Firebase implementation that throws "not implemented" for now.
11. **Dev wiring:** web app connects to emulators in development (Anonymous Auth, Firestore, Storage).
12. **Service worker:** app shell precached; `index.html` NOT cached long-term (architecture.md A1).
13. **Scripts:** dev, build, test (all workspaces), emulators, preview deploy. Update the Commands section in AGENTS.md.
14. **Hygiene:** `.env.example`, `.gitignore` (no secrets), keep docs/setup/new-computer.md current. Any new system tool goes into `environment.yml`.

15. **Versioning:** set every `package.json` version to `0.1.0`; add Phase 0 items under `[Unreleased]` in CHANGELOG.md. Do NOT tag or bump `VERSION` (I will ask for the v0.1 release).
16. **Work log and memory:** at the end, add a work log entry at the top of `docs/ai/worklog.md` and update `docs/ai/memory.md` (status, any new decisions), as AGENTS.md requires.

Before writing code, show me your plan as a short checklist and wait for my approval. Work on a branch `feat/phase-0-skeleton`. After each task: tell me how to verify it, run the tests, then commit with a Conventional Commit message.

Done when: `npm test` passes, the emulators start, the app runs locally, and a preview link opens on my phone showing the placeholder pages in BM with the olive accent and correct fonts.

---
