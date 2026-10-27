# Phase 1 prompt (v0.2): entry, identity, capture, queue, privacy, My Uploads

Paste everything between the lines into Claude Code from the repo root, on an up-to-date `main`.

---

Read AGENTS.md, docs/ai/memory.md (and the latest work log entries), docs/product/spec.md, docs/product/design.md and docs/architecture/architecture.md (Parts 1-3, 5 and 6, and every Part 2 pitfall marked Phase 1). We are starting Phase 1 (target v0.2). It changes the data model and security rules, so show me a plan and wait for my approval before writing code.

## Goal

A guest can scan a QR (permanent link with event code), join the event, give a name and an optional selfie, reach the menu, take photos with Snapshot or pick photos and videos with Upload from Gallery, choose Private or Public on the first upload, and see everything they sent in My Uploads. Nothing a guest captures is ever lost, even with bad internet or a page reload.

## Scope

**In:**
1. **Entry:** `/s/:publicId` and `/s/:publicId/:eventEntry`. `resolveCurrentEvent` and `joinEvent` callable functions (code check, rate limits 5 tries then wait, per device and per IP; writes `members/{uid}`; `history.replaceState` to `/:eventSlug` after joining). Neutral code screen for no code or wrong code, identical for unknown and non-joined events. Public view exposes only display names, current event title and theme.
2. **Identity:** Firebase Anonymous Auth; one guest per device per space; `guests/{uid}` with name; name screen; selfie screen with a big Skip (native camera `capture="user"`); selfie stored as the guest's profile image, never counted as an upload and never in any gallery.
3. **Menu:** tiles from the feature catalog via `isFeatureAvailable` (only `snapshot` and `galleryUpload` work in Phase 1; other entitled tiles show as "Akan datang" / "Coming soon" and are not tappable). Gallery tile locked until the first upload. Queue indicator ("3 menunggu dihantar").
4. **Snapshot:** native camera (`<input type="file" accept="image/*" capture="environment">`), original file kept untouched.
5. **Upload from Gallery:** multiple photos and videos, no length limit, 4 GB per-file cap; large files ask "Muat naik sekarang, atau nanti guna wifi?".
6. **Queue (`web/src/lib/queue/`):** Dexie; camera captures saved to IndexedDB before upload; gallery picks streamed from the original File (re-pick prompt if interrupted, pitfall U5); one file at a time, photos before videos; resumable uploads through the storage adapter (rule 9); retry with backoff; restart after reload with "Menyambung semula" (U3); `QuotaExceededError` fallback (U4); `navigator.storage.persist()`; "Biarkan halaman ini terbuka" while items are pending on iOS.
7. **Media records:** `mediaId` = UUID generated at capture, used as doc ID and storage path (rule 11, U1). Create the media doc with `status: "queued"` before upload; a Storage trigger on `/original/` sets `status: "uploaded"`, size and content type (full processing to `ready` comes in Phase 3). Client reads EXIF with exifr in a Web Worker; location and raw EXIF whitelist go to `media/{id}/private/meta` (rule 10, M7). `sortAt = capturedAt ?? uploadedAt` (server timestamp).
8. **Privacy step:** first upload shows the full-screen Peribadi / Awam choice (default Peribadi) with "Boleh tukar bila-bila masa di Muat Naik Saya"; later uploads use a small toggle remembering the last choice; "show my name" option on public items. First successful upload sets `galleryUnlocked` on the guest record.
9. **My Uploads (`/mine` and per event):** the guest's own items with status (waiting, sending with progress, sent, failed with retry), switch private/public, delete. Show local previews for items on this device; a neutral placeholder otherwise (server thumbnails arrive in Phase 3).
10. **Device handling:** detect in-app browsers (WhatsApp, Instagram, Facebook) and show "Buka dalam Safari / Chrome" with copy-link before onboarding (I1); clear recovery screens when camera or storage permission is denied, with "Teruskan tanpa" options (C6).
11. **Security rules + tests (rule 13):** event reads only for members and owners; guests write only their own `guests/{uid}` and media under their own uid path; media create requires the space entitled to and the event enabled for the feature (rule 17); `private/meta` creatable by the owner, readable only by owners; Storage: write own `original/` path only, size and content-type caps, originals readable by owner and space owners only; selfie path readable by owner and owners. Tests for each allow and each deny.
12. **i18n:** every new string in `ms.json` and `en.json` (BM written first, short and natural).

**Out (later phases):** wishes, call, video wish, boomerang (Phase 2); gallery, thumbnails, processing, decoration, folders (Phase 3); admin, aliases, bug reports, toggles UI (Phase 4).

## How to work

- Branch `feat/phase-1-mvp`. Split into three pull requests so each can be reviewed and tested on a phone:
  - **1a** entry, identity, menu, rules for spaces/events/guests;
  - **1b** Snapshot, Upload from Gallery, queue, media records, Storage rules;
  - **1c** privacy step, My Uploads, gallery unlock flag, device handling.
- Conventional Commits; `[Unreleased]` changelog entries for guest-facing changes.
- Respect the performance budget (guest first-load JS under 150 KB gzipped; exifr and Dexie load lazily where possible; heavy work in a Web Worker).
- Respect design.md (no banned patterns; one accent per screen; 64 px buttons; BM default).
- After each PR: run `npm test`, typecheck and build, deploy a Hosting preview channel, and give me a short phone checklist for iPhone Safari, iPhone via a WhatsApp link, and Android Chrome.
- At the end of each session: work log entry and memory update as AGENTS.md requires.

## Done when

- All tests pass, including new rules tests and queue unit tests (retry, duplicate prevention, quota error, restart after reload).
- On real phones via a preview link: join with the seeded test event (space 10001), name, selfie or skip, take a photo, upload several photos and a long video, turn wifi off and on mid-upload, reload the page mid-upload, and see every item reach "sent" in My Uploads exactly once.
- Private items cannot be read by another guest (proved by a rules test and by trying from a second phone).
- First-load JS still under 150 KB gzipped.

Do not tag or release; I will ask for v0.2 after reviewing all three PRs.

---
