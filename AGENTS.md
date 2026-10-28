# AGENTS.md — guestcam

Instructions for ANY AI coding assistant working in this repo (Claude Code, Codex, Cursor, a local model, ...). `CLAUDE.md` only imports this file. Keep tool-specific notes out of here.

**Before doing anything, read in this order:** `docs/ai/memory.md` (full context and decisions) → the latest entries of `docs/ai/worklog.md` → the docs your task touches (see Docs map).

# guestcam — event guest camera (codename; final product name not chosen yet)

Mobile web app (PWA) for weddings, engagements and other events. Guests scan a QR code, take photos, boomerangs and video wishes, "call the couple" to leave voice wishes, type text wishes, upload from their phone gallery, and view/download a shared gallery. No app install, no account.

Full spec: `docs/product/spec.md` — read it before starting any feature.

**Language rule:** ALL code and backend names are English: collections, fields, enums, functions, variables, files, routes, commit messages. Malay appears ONLY in UI strings (`ms.json`) and host-entered data (event titles, event slugs).

**Naming:** `guestcam` is only the codename (repo, conda env, package names). Never hard-code a product name or domain in UI code: the display name comes from one config value (`APP_NAME` in `web/src/config.ts`) and the `appName` key in `ms.json` / `en.json`, so the final brand can be swapped in one place.

## Stack
- TypeScript (strict) everywhere
- Front end: React + Vite, PWA (vite-plugin-pwa), Tailwind CSS, React Router
- i18n: i18next — `ms.json` is the DEFAULT language, `en.json` second
- Local queue: IndexedDB via Dexie
- Firebase (Blaze plan, region `asia-southeast1`):
  - Auth: Anonymous for guests; email/Google for hosts. Custom claim `superadmin` only; host roles (`owner`, `moderator`) are per space in `spaces/{id}/hosts/{uid}`
  - Firestore (real-time gallery), Storage (resumable uploads)
  - Cloud Functions (TypeScript): sharp for images, ffmpeg/ffprobe for video, boomerang, voice
  - Hosting + App Check
- Voice detection: @ricky0123/vad-web (Silero VAD)
- Metadata: exifr (browser), ffprobe (functions)

## Repo layout
npm workspaces monorepo. Full tree and the known-pitfalls list: `docs/architecture/architecture.md` — read it before each phase.
```
shared/       types, path builders, parseEntry, location (permanent id vs alias), limits, features catalog (used by web AND functions)
web/          React app: app/, components/ui/, features/<feature>/, lib/ (firebase, storage, queue, media, device), i18n/
functions/    triggers/, media/, storage/, admin/, counters/, cleanup/
rules-tests/  security rules tests against the emulator
docs/         product/, architecture/, decisions/, versions/, ai/, setup/ (see Docs map)
scripts/      seed and maintenance scripts
firestore.rules, storage.rules, firebase.json
```

## Spaces, events and routes
One **space** per couple holds several separate **events** (own theme, code, guests, gallery). Full design: `docs/architecture/architecture.md` Part 3.
- Path-based on ONE origin, no per-couple subdomains.
- Permanent address `/s/:publicId`: 7 random chars from the code alphabet, never changes. Printed QR codes ALWAYS use it. Without a valid code it shows only a neutral code screen (no names, title or theme).
- `spaceNumber`: 5-digit internal number for admin, invoices, support and audit logs only; NEVER in URLs or guest UI. Never changes, even when the plan changes.
  - `00000` founder's space (Zaim & Hidayah, alias `zaimhidayah`), `00001` public demo, `00002`-`09999` internal test spaces (assigned manually).
  - `10000` reserved, never assigned.
  - `10001` onward: real spaces (beta, trial, paid) from a server counter, in creation order. `10001` = the friend's engagement (plan `beta`).
- `plan`: `internal | demo | beta | trial | paid`, shown as a label next to the number (e.g. "#10012 · Trial"). Every limit (guests, uploads, storage, expiry, watermark) is read from the plan via `shared/src/limits.ts`; a trial converts to paid by changing the plan only.
- Clean alias `/:aliasName` (e.g. `/zaimhidayah`) works only inside a booked window (default: event day 00:00 → event end + 24 h), then is free for other spaces. Resolved on each visit; no scheduler. Outside the window: neutral "inactive" page with no couple info.
- Within a space: `/` → `resolveCurrentEvent`; `/:eventEntry` parsed by `shared/src/entry.ts` (split on the LAST hyphen; code = 4 chars from `a-h j-k m-n p-z 2-9`, lowercase) → `joinEvent` then `history.replaceState` to `/:eventSlug`; `/:eventSlug/gallery`.
- Shared folders: `.../:eventSlug/f/:folderId` (PIN screen; see architecture.md Part 5).
- `/mine`, `/login`, `/admin` at the site root.
- Alias names may not be all digits. Reserved names: s, admin, api, login, mine, demo, assets, gallery, sw, manifest, and any static file name.

## Domain
- The domain is ONE setting: `VITE_PUBLIC_BASE_URL` (web) / `PUBLIC_BASE_URL` (functions). Never hard-code a domain.
- Store ids and relative paths in Firestore, never full URLs; build links/QR codes from the setting.
- Old domains keep serving with no automatic redirect (only `/` redirects), so printed QR codes keep working.

## Non-negotiable rules
1. **Simple for all ages:** big buttons with icon + short word, large high-contrast text, max two taps from menu to capture, taps only (no long-press/swipe gestures), one question per screen.
2. **Every user-facing string goes in both `ms.json` and `en.json`.** Never hard-code text.
3. **Originals are never modified.** Decoration (stamp, frame, filter) is a recipe; functions render a separate decorated copy.
4. **Nothing captured is ever lost:** save to IndexedDB first, then upload through the queue (one file at a time, photos/wishes before videos, resumable).
5. **Privacy:** default visibility is private. Gallery locked until the guest's first upload. Location fields are never sent to guests.
6. **Never serve originals in the gallery** — thumbnails/display copies only; originals on explicit download.
7. Counters use distributed shards or count queries, never one shared document.
8. Security rules: guests write only their own docs/files; private items readable only by hosts.
9. **Storage adapter:** all file handling goes through one module (`web/src/lib/storage/` and `functions/src/storage/`) exposing `uploadFile` (resumable), `getDisplayUrl`, `getThumbUrl`, `getDownloadUrl`, `deleteFile`. Screens and functions never import Firebase Storage directly. v1 implements it with Firebase Storage; a later Cloudflare R2 implementation (signed multipart uploads, free egress) must drop in without touching UI code.
10. **Firestore rules cannot hide fields:** location and raw EXIF live in `media/{id}/private/meta` (hosts only). Media docs carry only `ownerUid` (random ID), never a guest name unless `showName` is true; `guests/{uid}` is readable only by that guest and hosts.
11. **Idempotent everything:** `mediaId` (UUID) is generated at capture and used as both doc ID and storage path; functions skip work already done; triggers only fire on `/original/` paths.
12. **Gallery shows only `status == "ready"`, `visibility == "public"`, `hidden == false`**, and the lock/reveal time is enforced in security rules, not just the UI.
13. Security rules changes require tests in `rules-tests/` in the same commit.
14. **Event access is membership-based:** codes live only in `events/{id}/private/access` (server-only); `joinEvent` checks them (rate-limited) and writes `members/{uid}`. Rules grant event reads only to members and hosts. The public space view exposes only display names + current event title + theme.
15. **Every host action** (hide, delete, export, settings, alias booking, folder PIN reset or delete) is written to `auditLog` by the server.
16. **Shared folders are private by path:** folder media live in `events/{e}/folders/{f}/media`, readable only by space owners, the creator and PIN members with the current `pinVersion`. PINs live only in `folders/{f}/private/access`; `joinFolder` checks them with rate limits. A folder PIN never grants event access; folder items never appear in the public gallery.
17. **Feature toggles:** a function is available only if the space is ENTITLED (package + add-ons, server-written `spaces/{id}.entitlements`) AND the event has it ENABLED (`events/{id}.enabledFeatures`, owner-written). Feature keys come only from `shared/src/features.ts`. Enforce in UI, security rules and functions; switching off never deletes content. Prices live in `catalog/current` as data (sen, integers) with a price snapshot per purchase. See architecture.md Part 6.

## Design
Follow `docs/product/design.md` for every screen. In short:
- Quiet paper base (`--paper` #F5EFE3, `--ink` #2B2420) + ONE accent per event from admin (test: deep olive #4B5320). Only the accent is themed.
- Fonts: Atkinson Hyperlegible (body, 18px min) + Instrument Serif (couple names, titles only). Self-hosted.
- Full-width 64px buttons, 8px corners, 1px hairlines, no shadows, no gradients, no emoji icons, no glassmorphism.
- Colours as CSS variables mapped into Tailwind; never hard-code hex values in components.
- Check the "Banned" list in design.md before shipping any screen.

## Performance budget
Measure on a mid-range Android (~4 GB RAM), Chrome DevTools "Slow 4G" + 4x CPU slowdown.
- QR scan → name screen visible: < 3 s. Reopen: instant and works offline (service worker cache).
- Guest first-load JS < 150 KB gzipped; fonts < 80 KB total (2 self-hosted, subset woff2, `font-display: swap`); tap response < 200 ms.
- Code-split: `/admin` never loads for guests; VAD model, boomerang recorder and decoration preview load lazily (prefetch VAD while the guest is on the menu).
- Modular Firebase imports only.
- Heavy work (previews, EXIF, compression) runs in a Web Worker; never block the main thread.
- Never load whole videos into memory; stream from the file in chunks.
- Camera captures are saved to IndexedDB first; gallery uploads stream from the original File (if interrupted, ask the guest to re-pick it). Call `navigator.storage.persist()`.
- Stop the camera stream when leaving capture screens; Wake Lock only during calls and video wishes.
- Gallery: virtualised list; ~400 px WebP thumbnails, lazy-loaded, fixed-size colour placeholders; live listener only on the newest 30 items, older pages fetched once; video posters only, 720p plays on tap; pause refresh when hidden.
- Storage files use immutable names with long cache headers.
- Upload queue has priority over gallery loading; reduce thumbnail size on slow connections / Save-Data.
- Run Lighthouse before each preview deploy; Firebase Performance Monitoring on for real-device data.

## Environment
- Always work inside the conda env `guestcam` (`environment.yml`): Node 24, Java 21, ffmpeg, Git, Python.
- New system tools go into `environment.yml`; libraries go into the relevant `package.json`. Commit lock files.
- New-computer steps live in `docs/setup/new-computer.md`; keep it current.

## Commands (run from the repo root, inside `conda activate guestcam`)
- Install: `npm ci` (one lock file for all workspaces)
- Dev server: `npm run dev` (http://localhost:5173; connects to the emulators)
- Emulators: `npm run emulators` (builds functions, then starts Auth, Firestore, Storage, Functions, Hosting and the UI at http://localhost:4000 on the `demo-guestcam` project)
- Seed the emulators: `npm run seed` (with the emulators running)
- Tests: `npm test` (unit tests, then security rules tests and callable-function tests inside the emulators via `firebase emulators:exec`; frees emulator ports before and after); `npm run test:unit` or `npm run test:emulators` for one part
- Free emulator ports (Windows leaves emulators running): `npm run emulators:kill`
- Typecheck: `npm run typecheck`
- Build: `npm run build`
- Deploy preview: `npm run deploy:preview` (builds the web app, deploys Hosting to the `preview` channel, link valid 7 days)
- Deploy backend to the real project (only when the human says so): `npm run deploy:backend` (Firestore and Storage rules, indexes, functions)
- Seed the real project's phone-test space (only when the human says so): `npm run seed:project -- --project <id>` (needs Google Application Default Credentials; prints the event code to the terminal only)

## Docs map
| Path | Contents |
| --- | --- |
| `README.md` | Public overview, setup, structure |
| `CHANGELOG.md` | Every version, Keep a Changelog format |
| `VERSION` | Current version, `A.B` |
| `docs/product/` | `spec.md` (product spec), `design.md` (design direction) |
| `docs/architecture/` | `architecture.md` (structure, pitfalls, spaces) |
| `docs/decisions/` | Architecture Decision Records (ADRs) |
| `docs/versions/` | `VERSIONING.md` (policy) + one detailed release note per version (`v0.1.md` ...) |
| `docs/ai/` | `memory.md` (project memory), `worklog.md` (session log), `prompts/` (phase prompts) |
| `docs/setup/` | `start-here.md`, `new-computer.md` |

## Versioning (full policy: `docs/versions/VERSIONING.md`)
- Version format `A.B` (major.minor). Current version lives in `VERSION`. `package.json` files use `A.B.0` because npm needs three numbers.
- Commit messages follow Conventional Commits: `feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`, `perf:`, `security:` with an optional scope, e.g. `feat(queue): resume uploads after reload`.
- Every change that matters to a user or host is added under `## [Unreleased]` in `CHANGELOG.md` in the same commit.
- Never bump the version, create a tag or a release unless the human asks. When asked, follow the release steps in `VERSIONING.md`.
- Branches: `main` is always deployable; work on `feat/...`, `fix/...`, `docs/...` branches merged by pull request.

## Work log and memory (mandatory for every AI session)
- **Work log:** at the end of every session (and before the final commit), add an entry at the TOP of `docs/ai/worklog.md` using its template: date and time (Asia/Kuala_Lumpur), agent and model, version, goal, what changed and why, files touched, commands and test results, decisions, problems and risks, next steps, commit hashes. Be specific enough that a human can review without reading the diff.
- **Memory:** when a decision is made or changed, the project status moves, or a new constraint appears, update `docs/ai/memory.md` in the same commit (decision log, status, open questions). Never delete history; mark superseded decisions as superseded.
- **Big decisions** (data model, security, hosting, vendor choice) also get an ADR in `docs/decisions/`.
- Never put secrets, keys, personal data of guests or private event codes in any doc.

## Working style
- Plan first, then code. Show the plan and wait for approval on anything touching data model or security rules.
- One feature per session; keep changes small and reviewable.
- Run against emulators before any deploy. Never deploy to production without being asked.
- Phone cameras need HTTPS: test on real phones via Hosting preview channels.
- Commit after each working step with a clear message.
