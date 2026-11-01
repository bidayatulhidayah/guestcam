# Project memory

The single source of context for ANY AI assistant (or new developer) joining this project. Read this first, then the latest entries in `worklog.md`.

Maintenance rules:
- Update in the same commit whenever a decision is made or changed, the status moves, or a constraint appears.
- Never delete a decision. Mark it **Superseded by D-0xx** and add the new one.
- Keep facts here; keep session-by-session detail in `worklog.md`.
- No secrets, keys, event codes or guest personal data.

Last updated: 2026-10-29 (Phase 1b: capture, upload queue, media records, triggers)

---

## 1. What this project is

A mobile web app (PWA) for weddings, engagements and other events. Guests scan a QR code at the venue and, with no app install and no account:
- take photos, boomerangs and video wishes,
- "call the couple" to leave a voice wish,
- type a wish (with an optional photo),
- upload photos and videos from their phone gallery,
- choose for every item whether it is private (couple only) or public (shared gallery),
- view and download the shared gallery.

The couple (hosts) manage everything from an admin dashboard: themes, codes, moderation, export.

## 2. People and ownership

| Who | Role |
| --- | --- |
| Hidayah | Founder, developer, product owner, super admin. Engineer based in Malaysia; works in English and Malay |
| Zaim & Hidayah | Founder's own events: space #00000, alias `zaimhidayah` |
| Friend (engaged couple) | First real event (engagement), space #10001, plan `beta` |
| Guests | Wedding guests of all ages, many older relatives; Malay first, English second |

## 3. Status

| Item | State |
| --- | --- |
| Version | **0.1** released 2026-10-27 (tag `v0.1`, Phase 0 skeleton). Not deployed to production (only the `preview` channel) |
| Phase | Phase 1 (target v0.2) in progress: 1a (entry, identity, menu) merged; 1b merged (PR #6, backend deployed 2026-10-30); first-load speed and safe app updates merged (PR #7); 1c (fast name screen, privacy step, My Uploads, device handling) merged (PR #8); 1d polish (in-app link and back links, Snap Gambar video, My Uploads grid, theme mockups A–E in `docs/product/themes/`) squash-merged (PR #9). Backend deployed again 2026-11-01 (the 1d snapshot-video rule is live). 1e (Snap Gambar asks Gambar or Video, D-088) squash-merged (PR #10). 1e follow-up from the phone test on `fix/phase-1e-previews`: previews for photos and videos in My Uploads, and the "Muat Naik Saya (n)" link on the Snap screen (D-089); preview redeployed 2026-11-01, phone check pending. Next: theme templates on `feat/theme-templates` after 1e is merged (D-087), then "Jemput Kawan" (D-076), then v0.2 after iPhone checks |
| Repo | GitHub, private: `bidayatulhidayah/guestcam` |
| Firebase | Project `guestcam-2026`; Firestore and Storage confirmed in `asia-southeast1` (Singapore), 2026-10-27; emulators use the `demo-guestcam` demo project. 2026-10-28: Firestore/Storage rules, indexes and functions (`ping`, `resolveCurrentEvent`, `joinEvent`, Node 24) deployed with Hidayah's approval; artifact cleanup policy 1 day. 2026-10-30: 1b rules, indexes and the triggers `onOriginalUploaded` and `onMediaDeleted` (retry on failure) deployed by Hidayah with `--force`. Hosting only on the `preview` channel. No real users yet |
| Runtime | Node 24 (D-055) |
| Hosting | Free Firebase domain (`guestcam-2026.web.app`) until after the friend's engagement; Phase 0 preview channel `preview` |
| Product name | Not final. Codename `guestcam`; working favourite **Kenang** (`kenang.app`). Shortlist in the spec |
| Business | Personal use first; possible business later (pricing explored in a separate chat) |

## 4. Goals and constraints

- **Primary goal:** works reliably at the friend's engagement, then at the founder's wedding.
- **Scale:** up to 1,000 guests per event, 200 using the app at the same moment.
- **Main constraint:** venue internet, not storage. Nothing a guest captures may ever be lost.
- **Audience:** every age; must be usable without help. Bahasa Melayu by default.
- **Budget:** cheap pay-as-you-go (Firebase Blaze) with budget alerts at RM 100 / 200 / 400.
- **Developer:** one person learning as she builds, using AI coding assistants; may switch AI tools or computers.

## 5. Decision log

Status: **Active** unless marked otherwise. "Why" is the reason at the time of the decision.

### Product

| ID | Decision | Why |
| --- | --- | --- |
| D-001 | Mobile web app (PWA), entered by QR code; no install, no guest account | Lowest friction; competitors show every extra step loses guests |
| D-002 | Target 1,000 guests per event, 200 concurrent | Size of a large Malaysian wedding |
| D-003 | Test at the friend's engagement before the founder's wedding | Real-world rehearsal |
| D-004 | Bahasa Melayu default, small EN toggle; no language-choice screen | Most guests are Malay speakers; one less step |
| D-005 | Guest flow: scan → name → selfie (skippable) → menu. Gallery locked until the guest's first upload (any upload, private included; the selfie does not count) | Guests experience the private/public choice before seeing others' photos, so they are not afraid to share |
| D-006 | Every item is private (couple only) by default. First upload shows a full-screen Private/Public choice; later a small toggle that remembers the last choice. Public items can show the name or be anonymous | Trust; nobody is surprised by something becoming public |
| D-007 | **Superseded by D-045.** Menu: Snapshot, Upload from Gallery, Video Wish, Boomerang, Call the Couple, Type a Wish, Gallery | Final menu after several iterations |
| D-008 | Photos use the phone's native camera through the browser | Full resolution and EXIF metadata; in-browser cameras give lower quality and no EXIF |
| D-009 | Ordinary event videos come through Upload from Gallery (filmed with the phone's own camera): no length limit, 4 GB per-file cap, uploads open for 30 days after the event | Simpler and full quality; guests can send long videos from home. Narrowed by D-084: Snap Gambar also takes camera videos |
| D-010 | Call the Couple: phone-call screen, phone held to the ear, no host greeting. Voice detection (not volume): soft beep at 45 s without voice, ends at 60 s. Safety cap: warning at 14:00, ends at 15:00. Auto-saved on end; unlimited calls | Clear audio in a loud hall; guests often forget to press stop |
| D-011 | Video Wish follows exactly the same stop/silence/cap rules as the call | One behaviour for guests to learn |
| D-012 | Boomerang: 1-2 s in-app capture; the loop is rendered on the server | Works on every phone |
| D-013 | Type a Wish: text box + optional photo; no wish categories or tags | Simplicity |
| D-014 | No live slideshow. Gallery mode per event: live, after event, or off | Owner's preference |
| D-015 | Gallery is one timeline sorted by capture time (fallback upload time); no manual albums | Simplicity; old uploads land in their real date |
| D-016 | Uploads unlimited until the event's total reaches a host-set threshold, then a per-guest quota switches on | Generous by default, protected from runaway use |
| D-017 | Originals never modified; metadata read and stored for every item, including location. Location is host-only, never shown to guests | Founder values full metadata; guest privacy |
| D-018 | Decoration is non-destructive: name stamp on by default; optional frames and filters behind one "Hiasan" button; videos get stamp and frame only | Originals stay clean; decoration can be regenerated |
| D-019 | "Lapor Masalah" bug report button on every screen (auto-attaches device and queue info); copyright footer per event | Debugging at real events; ownership |
| D-020 | Offline-first upload queue: save on the phone first, upload one file at a time, photos and wishes before videos, resumable | Venue internet is the main risk |

### Technology

| ID | Decision | Why |
| --- | --- | --- |
| D-021 | TypeScript (strict) everywhere; React + Vite PWA (not Next.js); Tailwind; i18next | Browser-heavy app, static hosting, simpler learning curve; types guard the data model |
| D-022 | Firebase (Blaze plan, region asia-southeast1 Singapore): Auth, Firestore, Storage, Functions, Hosting, App Check | Integrated, real-time, resumable uploads; Singapore is close to Malaysia |
| D-023 | No external CMS: event settings and themes edited from the app's own `/admin`. Payload CMS reconsidered only if the product goes commercial | Small needs; avoid a second backend |
| D-024 | All file handling through one storage adapter; Cloudflare R2 (free downloads) planned for the business stage | Downloads (egress) are the biggest Firebase cost |
| D-025 | npm workspaces monorepo with a `shared/` package used by web and functions | Types and paths can never disagree |
| D-026 | Conda environment (`environment.yml`) for system tools; npm lock files for libraries | Founder may switch computers |
| D-027 | GitHub (not GitLab) | Claude Code cloud sessions, PR auto-fix and Firebase preview integration need GitHub; more free CI minutes |
| D-028 | All code and backend names in English; Malay only in UI strings and host-entered data | Maintainability; any developer or AI can work on it |
| D-029 | Codename `guestcam` for repo, env and packages; product name from one config value | Name not final |
| D-030 | Design: quiet paper base, ONE accent per event from the couple's invitation card (test: deep olive #4B5320), Atkinson Hyperlegible + Instrument Serif, banned "AI look" list | Clean, readable for older guests, not template-looking |
| D-031 | Performance budget: under 3 s to the name screen on Slow 4G; guest JS under 150 KB gzipped | Mid-range phones in crowded halls |

### Spaces, addresses and access

| ID | Decision | Why |
| --- | --- | --- |
| D-032 | One **space** per couple holding several fully separate **events** (e.g. tunang, nikah, sanding, bertandang), each with its own theme, code, guests and gallery | Same couple, different events and guest lists |
| D-033 | Path-based addresses on one site/origin; no per-couple subdomains | Guest identity stays the same whether they scan or type; no 20-subdomain Firebase limit; works on the free domain |
| D-034 | Permanent link ID `publicId`: 7 random characters (`/s/7k3qmx`), used in every printed QR code. Internal `spaceNumber`: 5 digits for admin, invoices and support only, never changes | Random links cannot be enumerated; sequential numbers are convenient internally |
| D-042 | Space numbers: **#00000 Zaim & Hidayah**, #00001 public demo, #00002-#09999 internal tests (manual); #10000 reserved (never assigned); real spaces from **#10001** (friend's engagement) in one sequence for beta, trial and paid | Easy to remember; trials keep their number when they convert |
| D-043 | `plan` field (`internal`, `demo`, `beta`, `trial`, `paid`) with per-plan limits in one table, built from Phase 0 | Trials and business plans later need no data migration |
| D-045 | **Shared folders (Folder Kongsi):** any event guest can create a private folder and bulk-upload photos and videos (originals, metadata kept). Visible only to the couple (space owners), the creator and anyone with the folder's 6-digit PIN; PIN holders can view, download single items and add; owners and creator can download a ZIP, reset the PIN (optionally removing old members) or delete. Never in the public gallery; moderators excluded; a folder PIN opens that folder only, not the event. Menu becomes: Snapshot, Upload from Gallery, Video Wish, Boomerang, Call the Couple, Type a Wish, Shared Folder, Gallery. Planned for v0.4 (Phase 3). Details: architecture.md Part 5, ADR-0005 | Guests stop using AirDrop/WhatsApp to send photos; the couple receives every original automatically |
| D-046 | **Feature toggles and packages:** a function is available only if the space is entitled to it (package + add-ons, set by super admin or payment) AND the host enabled it for that event. One feature catalog in `shared/src/features.ts`. Proposed packages: Asas (snapshot, gallery upload, text wish, gallery, theme), Lengkap (+ video wish, call, boomerang, name stamp), Premium (+ shared folders, decoration, clean alias, multi-event, moderator, full export), Custom; single features and quantities sold as add-ons. Prices stored as data with a snapshot per purchase; amounts decided in the costing chat. Switching off never deletes content. Toggles built in v0.5; checkout after v1.0. Details: architecture.md Part 6, ADR-0006 | Couples pay only for what they use; costly functions (video, folders) priced accordingly |
| D-044 | **Planned after v1.0:** public demo at `/demo` (visitors see only their own uploads + curated gallery, 24 h auto-delete) and custom client trials created from admin (e.g. 14 days, 20 guests, watermark; convert by changing plan; read-only 7 days then deleted) | Marketing and sales without risking strangers' content or costs |
| D-035 | Clean alias (`/zaimhidayah`) is time-limited: booked per event, active by default from 00:00 on the event day to 24 h after the event ends (can be opened earlier manually), then free for other couples. Same name with overlapping dates is resolved manually by the super admin | Clean name during the event; names do not get used up |
| D-036 | Event access is membership-based: per-event 4-character codes (no look-alike characters) checked by a server function with rate limiting; the code is removed from the address bar after joining. Unknown or non-joined events show the same generic code screen | Privacy; nothing reveals that an event exists |
| D-037 | Couple access: each partner has their own owner account; optional moderator role (hide items only); every host action written to an audit log | Security and accountability |
| D-038 | The domain is one setting; database stores ids and paths only; old domains keep serving without redirect | Buying the domain later must not break printed QR codes |
| D-039 | Location and raw EXIF live in a host-only subdocument; media docs carry only `ownerUid`; `mediaId` is a UUID generated at capture | Firestore rules cannot hide fields; retries must not duplicate |

### Phase 0 implementation (2026-10-27)

| ID | Decision | Why |
| --- | --- | --- |
| D-047 | `@guestcam/shared` is consumed as TypeScript source (no build step); functions are bundled with esbuild so shared code is built in and `@guestcam/shared` is only a devDependency of functions | Cloud Functions deploys cannot install a workspace package |
| D-048 | Emulators and rules tests always run on the demo project `demo-guestcam`; the dev web app switches to it automatically | Demo projects can never touch real Firebase resources |
| D-049 | Product name lives only in `web/src/brand.ts` (page title, manifest) and the `appName` i18n key; `config.ts` re-exports it | `vite.config.ts` needs the name without importing env code |
| D-050 | Firebase JS SDK loaded with a dynamic import (own chunk), not in the first-load bundle | Guest first-load JS budget (< 150 KB gzipped); Phase 0 first load is ~120 KB |
| D-051 | Service worker updates are applied on the next route change; capture screens call `holdUpdates(true)` | Pitfall A1 without interrupting a recording |
| D-052 | **Superseded by D-055.** Rules tests pin `@firebase/rules-unit-testing` 5 + `firebase` 12 (Node 22 compatible); the web app uses `firebase` 13 | Firebase JS SDK 13 requires Node >= 24.12 when run in Node |
| D-053 | Root `overrides` pins `@grpc/grpc-js` ^1.14.6 | Firebase's bundled grpc-js 1.9 has known advisories (Node-side only) |
| D-054 | Default copyright owner "Hidayah" (env `VITE_COPYRIGHT_OWNER`), until per-event owner text exists | Founder's choice, 2026-10-27 |
| D-055 | **Node 24 everywhere:** conda env `nodejs=24`, `engines.node: "24"` in every package.json, Cloud Functions runtime `nodejs24`, functions bundle targets node24; rules tests use the current SDK (`@firebase/rules-unit-testing` 6, `firebase` 13). Supersedes D-052 | Firebase JS SDK 13 needs Node >= 24.12; one SDK version across the repo; Node 24 is the current LTS with longer support than 22 (Node 22 EOL April 2027, before or around the founder's wedding) |
| D-056 | `npm run emulators:kill` (PowerShell, Windows only) frees the emulator ports by stopping only Firebase emulator processes; it runs as `pretest` and `posttest` | Windows leaves emulator `java.exe`/`node.exe` running after `emulators:exec` and Ctrl+C, so the next run failed with "port taken" |
| D-057 | Guests never read `spaces/*`; `resolveCurrentEvent` and `joinEvent` return a guest-safe `EventView` (no dates, plan, space number or codes). Rules check entitlements server-side. ADR-0007 | Rules cannot hide fields (P1); `spaceNumber` must never reach guests |
| D-058 | **Partly superseded by D-067 (space lock scope).** Wrong event codes limited per device (5, then 5 min), per IP (100 per 15 min, hashed) and per space (300 per hour locks code entry for that space for 15 min + `spaceCodeEntryLocked` audit entry) | Hidayah, 2026-10-27: venue wifi shares one IP; anonymous accounts make device limits weak |
| D-059 | Event codes are unique within a space (generation and seeds enforce it); `joinEvent` without a slug matches the code across the space's open events | Hidayah, 2026-10-27: lets the plain code screen work |
| D-060 | `Guest.galleryUnlocked` and `firstUploadAt` are server-written only (the upload trigger, Phase 1b); `lastVisibility` is null until the first privacy choice; `selfiePath` added | Pitfall P3: a client-set flag would bypass the gallery lock |
| D-061 | Bundle plan: React Router in declarative mode (17 KB, not the 35 KB data router), Firestore Lite for guests (41 KB, not 147 KB), Firebase core (app, auth, functions) preloaded as its own chunk; full Firestore only for the Phase 3 live gallery. First screen 142 KB gzipped. Switching to wouter is pre-approved if the first screen exceeds 150 KB (record it here if it happens) | Performance budget D-031 |
| D-062 | Deleting a media doc triggers a server function that deletes its files (original now, derived copies later); guests cannot delete or overwrite in Storage | Hidayah, 2026-10-27: Storage is create-only for guests |
| D-063 | "Muat naik sekarang, atau nanti guna wifi?" asked once per selection (not per file) when the selection holds a file over 50 MB | Hidayah, 2026-10-27 |
| D-064 | **Superseded by D-066.** Phone testing uses a test space #10001 "Pasangan Ujian" in `guestcam-2026`, seeded by `npm run seed:project` with a random permanent id and code printed only to the terminal. #10001 is the friend's engagement number (D-042): rename/reuse it for the real engagement, or reassign before go-live | Hidayah approved seeding 10001 for Phase 1 tests |
| D-065 | Admin scripts against the real project (`seed:project`) use Google Application Default Credentials from the Google Cloud CLI (`gcloud auth application-default login`); no service-account key files | Hidayah, 2026-10-28: no long-lived secrets on disk |
| D-066 | The real-project phone-test space is **#00100** (plan `internal`, "Pasangan Ujian", event `tunang`), seeded by `npm run seed:project`; the client counter starts at 10001, so #10001 stays free for the friend's engagement | Hidayah reserved 00100 for testing, 2026-10-28 |
| D-067 | The space-wide wrong-code lock blocks only codes typed without an event slug (the plain code screen). QR links (event slug + code) keep working during a lock, still under the per-device and per-IP limits. Every wrong code, with or without a slug, still counts toward the space limit and its audit entry | Hidayah, 2026-10-28: a flood of typed guesses must not stop guests scanning printed QR cards. Known trade-off: a caller can always send a slug, so the space lock mainly stops guessing across all events; slug guesses are limited by device (5 then 5 min) and IP (100 per 15 min), and App Check follows in Phase 5 |
| D-068 | `seed:project` against a live project creates only test space #00100 and its event (four `create()` writes: space, publicIds entry, event, private/access); stops without writing if #00100 exists; refuses any number outside 00002-09999; never writes counters, the catalog, #00000 or #10000+ | Hidayah, 2026-10-28: the live project must never be overwritten by a script |
| D-069 | The Google Cloud CLI is a non-conda tool installed with Google's Windows installer (conda-forge has no Windows build); it is not in `environment.yml` | Hidayah, 2026-10-28 |
| D-070 | Members may `get` a media doc that does not exist (`resource == null && isMember`), so the queue can check before creating; existing items stay readable only by their owner and space owners | Found by the 1b smoke test: the owner-only read rule errors on a missing doc and blocked every first upload. Ids are random UUIDs, so nothing leaks |
| D-071 | Camera photos are written to IndexedDB with status `preparing` the moment the camera returns them; EXIF is read afterwards and the item released. A reload turns `preparing` into `waiting` (sent without EXIF) | Rule 4: EXIF reading can take seconds; the photo must never wait in memory |
| D-072 | "Nanti guna wifi" holds only the files over 50 MB in that selection; smaller files in the same selection send at once. Held items wait for "Hantar sekarang" (phones cannot reliably report wifi). Refines D-063 | Small photos should not wait behind a long video |
| D-073 | Upload and delete triggers retry on failure and are idempotent (skip items not `queued`; deleting missing files is fine). A file over the plan limits, of the wrong type or without a media doc is deleted and its item marked `failed` | Rule 11; pitfalls M1, U2, U6 |
| D-074 | App updates (service worker) apply at a safe moment: at a screen change, or 5 s after the guest returns to the app while on the menu; never while a screen holds updates (saving a capture, the wifi question) or while the upload queue holds a file only in memory (unsent gallery pick, storage-full capture). An open page checks for a new version on return at most every 30 min. Refines pitfall A1 | Found 2026-10-30: a guest who stays on the menu never moves screens, so a fix deployed on the event day would never reach them; a reload during a gallery upload would make the guest re-pick |
| D-075 | First-load hints in the build: `src/boot.ts` is a separate async entry that loads the Firebase core and starts anonymous sign-in on `/s/` links while the main code downloads; the Firebase core chunks are modulepreloaded; preconnect to the sign-in and functions servers; Dexie is its own chunk. Measured on the preview (Slow 4G + 4x CPU): name screen about 5.3 s (was 6.6-6.9 s); first-screen JS about 145 KB gzipped (was about 175 KB: Dexie had been loading on the first screen) | Performance budget. The remaining time is three server steps in a row (sign-up, account lookup, `joinEvent`), about 3 s on Slow 4G, which Firebase anonymous sign-in cannot avoid |
| D-076 | **Approved, not built yet.** "Jemput Kawan": a full-width button under the menu tiles opens a screen with the event QR (permanent link + event + code), the code in large letters, Kongsi (Web Share, falls back to copy link) and Muat Turun (QR picture). New feature key `guestInvite`, in every package and on by default; hosts can switch it off. `joinEvent` returns the code only when the feature is on; the phone keeps it with the saved event. Built as its own PR after 1c | Hidayah, 2026-10-30: guests share the event with people at their table or who missed the QR card. Risk: forwarding beyond the guest list; mitigated by the host toggle and code regeneration (Phase 4) |
| D-077 | **Planned, Phase 4/5 (event day mode).** Keep `joinEvent` warm (Cloud Functions minimum instances = 1) only during an event's active window, switched on and off automatically from the event schedule; never always-on. Not built yet | Hidayah, 2026-10-31: a cold start can add 2-5 s for the first guest to scan; an always-on instance costs money every day of the year for a few hours of use |
| D-078 | A first-time guest on a QR link types their name on a neutral screen ("Selamat datang", no names, title or theme) while anonymous sign-in and `joinEvent` run in the background; the couple's names and theme appear from the selfie screen. A wrong code goes straight to the code screen; the name is saved only after a successful join; if the join has not finished 15 s after "Teruskan" (or failed offline), "Cuba lagi" retries with the typed name kept. A guest the phone already knows waits for the join as before. Measured: name box ready at about 2.5 s on Slow 4G + 4x CPU (was about 4.5 s) | Hidayah, 2026-10-31. The code check is about 3 s of server steps that cannot be skipped; the guest now spends them typing |
| D-079 | Privacy step: the first upload of an event shows Peribadi / Awam (Peribadi first and marked as default), then for Awam "Tunjuk nama anda di galeri?". Camera photos are saved first and wait (`awaitingChoice`); a gallery selection is asked before the wifi question. Closing the page at the question sends the waiting photos as Peribadi and leaves `lastVisibility` null, so the question returns. Later uploads use a menu switch; the choice lives on the phone and on the guest record (`lastVisibility`, `showName`). Copying the guest's name onto public items is left for the Phase 3 gallery | Hidayah, 2026-10-31 (after capture; addition 4) |
| D-080 | My Uploads at `/s/:publicId/:eventSlug/mine` (fixed routes are English; supersedes the spec's `/saya` example). Queue items and the guest's media docs are merged by `mediaId`; the phone decides upload progress and that the file arrived, the server only adds a refusal (and the privacy once the doc exists). Delete: one confirmation screen; an upload in progress is aborted and never sent again; the doc is deleted and the server removes files, including one that lands after the delete. Photos get a ~320 px preview made in a Web Worker and kept on the phone until Phase 3 thumbnails | Hidayah, 2026-10-31 (previews on phone; addition 3, 5) |
| D-081 | In-app browsers (Instagram, Facebook, Messenger, TikTok, LINE; by user agent) get a notice before anything else on `/s/` links: "Buka dalam Chrome" (Android intent link) or Safari steps (iPhone), "Salin pautan", "Teruskan di sini". Nothing is joined and the code stays in the address until the guest chooses to stay; the choice is remembered in that browser. WhatsApp on iPhone cannot be detected | Hidayah, 2026-10-31 (advise, never block; addition 2). Pitfall I1 |
| D-082 | Device recovery (pitfall C6): a camera picker closed without a photo offers "Kamera tidak terbuka?" (steps per browser, "Cuba lagi", "Teruskan tanpa kamera"); if IndexedDB is refused, the queue runs on an in-memory database (`fake-indexeddb`, loaded only then), the menu asks the guest to keep the page open, and app updates wait until everything is sent | Plan 1c |
| D-083 | The event screens (selfie, menu, capture, privacy, My Uploads, gallery) are a lazy chunk fetched while the guest types their name and precached for offline reopening; the first-screen budget now covers the name-screen path only (144.6 KB gzipped, gzip -9 of every script the page preloads) | Room for 1c and later features under the 150 KB budget |
| D-084 | Snap Gambar opens the phone's own camera in photo OR video mode (`accept="image/*,video/*"` with `capture`). Camera videos are originals: saved to IndexedDB first like photos (rule 4), no length limit, 4 GB cap, sent after photos; one over 50 MB is saved as `held` and gets the "now or later on wifi" question (after the first privacy question), and "now" releases only that video. Rules: a `snapshot` media doc may be `image` or `video`. Narrows S-03 and D-009: the in-app live recorder stays out, and Ucapan Video (with the silence rule) stays in Phase 2 | Hidayah, 2026-11-01 (phone test feedback; plan approved). Phone test 2026-11-01: recording a video this way does not work on phones yet; the cause is not investigated yet; fix in 1e. Superseded in part by D-088: the single combined camera input is replaced by two buttons, one input each |
| D-085 | My Uploads is a compact preview grid (two columns on phones, three from 480 px) with printed-photo borders and no kind label. Per item, icon-only 48 px buttons: lock/globe (Peribadi/Awam), person (show name; Awam only), bin (delete, same confirmation screen); status as a corner mark (dot with check = sent, ring = sending, empty ring = waiting, "!" = needs the guest). A one-line legend sits above the grid and every icon has an aria-label. Recorded in design.md as the one exception to "icon + word" | Hidayah, 2026-11-01 (phone test feedback) |
| D-086 | After "Teruskan di sini" in an in-app browser, a very small "Buka dalam Chrome" (Android, opens Chrome directly) / "Buka dalam Safari" (iPhone, shows the steps and "Salin pautan" again) link sits in the top row of every `/s/` screen. It carries the address as first opened, with the event code, held in memory only; the page underneath stays mounted. Code, error and help screens get a very small "Kembali" (previous page, hidden when there is none; on help screens it closes the help) | Hidayah, 2026-11-01 (phone test feedback) |
| D-087 | **Approved, not built yet** (build on `feat/theme-templates` after 1e is merged). Theme templates: `Theme` gets a `template` key; `classic` = today's design.md look, `gerbangBlush` = direction D (C's arch layout in the Blush shawl colours: paper #F3E9E6, raised #E7D8D8, hairline #D5C7C9, ink #3A2A26, muted #6B5A55, accent #7A5A56 with white text, names/monogram #86665A large serif only, mauve #B59691 and periwinkle #A5A3BA line work only, lighter paper fibres). Missing or unknown = `classic`. The paper and other neutrals come from the template; the accent stays per event. Applied from the name screen on (it comes after `joinEvent`); only the code screen and the inactive/alias pages stay `classic`. Themes are CSS variables only: no new fonts, images or JS libraries; guest first-load JS stays under 150 KB. An automated test checks every template's text pairs (4.5:1, 3:1 for large serif). No rules or functions change. Records: an ADR and design.md (partly superseding D-030's "only the accent changes per event"). Live space 00100: Hidayah sets `defaultTheme.template = "gerbangBlush"` in the Firebase console. Directions A, B, C and E stay in `docs/product/themes/` for a later template themes page | Hidayah, 2026-11-01 (plan approved, with changes: name screen themed; CSS variables only) |
| D-088 | Snap Gambar opens a screen with two big buttons, "Gambar" (primary, `accept="image/*"`) and "Video" (`accept="video/*"`), both `capture="environment"`, one hidden input each. Reason: one input with `accept="image/*,video/*"` + `capture` opened photo mode only on Android and varied on iOS (phone test). Still two taps from the menu to the camera. The screen stays open after a capture (notices and "Kamera tidak terbuka?" show there); "Kembali" returns to the menu. Videos use the same queue as in D-084 | Hidayah, 2026-11-01 (Phase 1e) |
| D-089 | My Uploads previews (phone test of PR #10: videos had none; a photo preview finished after the item's last status change stayed hidden until reopening). Every capture or pick gets a ~400 px JPEG preview in the background, stored in IndexedDB `thumbs` under the mediaId, separate from the queued original; kept after sending, deleted only when the guest deletes the item. Photos: in the Web Worker, then once on the page (`img.decode()`) if the worker cannot decode it (HEIC on older iOS; Android cannot show HEIC: placeholder). Videos: one frame about 0.5 s in, through an object URL (streams from the file, never loaded into memory), shown with a small play mark. One preview at a time. The queue item records `preview: ready \| none`, so the list updates the moment it exists. Never an error: anything without a preview, and items from another phone, keep the neutral placeholder until Phase 3 thumbnails. Also: a small "Muat Naik Saya (n) →" link under the Gambar and Video buttons on the Snap screen, same style as "Kembali", shown once the guest has items | Hidayah, 2026-11-01 (phone test of PR #10) |
| D-090 | Upload progress and stuck uploads (Hidayah's phone test, 2026-11-01). (1) Every upload under way shows a `ProgressRing` (accent arc on a paper disc, 15 px bold number, role progressbar): in My Uploads the file being sent shows its percentage (at most 99% until the server confirms; then the "Dihantar" mark) over its preview, waiting files a slowly turning arc (still with reduced motion); the menu and the Snap screen show the queue status with the same circle and the count left. (2) Queue watchdog: every network step (sign-in, media doc, meta, file check) has 45 s, and an upload with no bytes moving for 60 s is cancelled; both are retried from the queue as `stalled` (Firebase's own resumable retry runs for 10 minutes and blocked the one-at-a-time queue). (3) A reload, coming back to the app and the phone coming back online make waiting items due at once (no waiting out a retry delay of up to 5 minutes) | Hidayah, 2026-11-01 (phone test) |
| D-091 | My Uploads: a guest plays their own video by tapping its tile (the whole tile is a button; the play mark used to be only a picture). Source: this phone's copy while it is still here (IndexedDB before sending, or the picked File on this page), otherwise the guest's own original from Storage via the adapter's `getDownloadUrl` (now implemented; owner-only read in storage.rules). Counts as rule 6's "originals on explicit download": an explicit tap, never in the gallery. The browser streams it. A video this phone cannot play shows "Video ini tidak boleh dimainkan di telefon ini." Also: the video frame grab plays the video muted for a moment when no frame arrives after the seek (iPhone Safari loads no frames for a paused video) | Hidayah, 2026-11-02 (phone test: no preview, play mark did nothing) |

### Process

| ID | Decision | Why |
| --- | --- | --- |
| D-040 | Versioning `A.B` (major.minor), git tags `vA.B`, Keep a Changelog, Conventional Commits, one release note per version | Founder's preferred scheme with standard practice around it |
| D-041 | `AGENTS.md` is the canonical AI instruction file; `CLAUDE.md` only imports it. Every AI session must write a work log entry and update this memory | Founder may switch AI tools or use a local model |

### Superseded

| ID | Old decision | Superseded by |
| --- | --- | --- |
| S-01 | Language-choice screen at entry | D-004 |
| S-02 | Wish types/tags (Doa, Tahniah, Nasihat...) | D-013 |
| S-03 | In-app 1-minute live video recorder for normal clips | D-009; narrowed by D-084 (normal clips also come from Snap Gambar through the phone's own camera) |
| S-04 | Host recorded greeting before voice messages | D-010 |
| S-05 | Manual sub-albums (Nikah, Resepsi) | D-015 |
| S-06 | Per-couple subdomains (`zaimhidayah.kenang.app`) | D-033 |
| S-07 | Space slugs never released / 2-year quarantine | D-035 |
| S-08 | Sequential public link IDs (`/s/1001`) | D-034 |
| S-09 | Original route `/:eventSlug-:code` with two params in one segment | D-036 and `shared/src/entry.ts` |
| S-10 | 4-digit space numbers (#0000, first other space #0001) | D-042 |
| S-11 | Seven-item menu without folders (D-007) | D-045 |
| S-12 | Node 22 (conda env, engines, Functions runtime `nodejs22`) | D-055 |
| S-13 | Test space on #10001 (D-064) | D-066 |
| S-14 | Space-wide lock blocks every code entry (part of D-058) | D-067 |

## 6. Open questions

| Question | Notes |
| --- | --- |
| Space-wide code lock | A flood of wrong codes can block real guests for 15 min; hosts need an "unlock code entry" action (Phase 4) |
| Final product name | Favourite Kenang; check domain, Instagram handle, MyIPO trademark |
| Copyright footer owner line | Default "Hidayah" for now (D-054); per-event owner text still to design |
| Friend's engagement date | Sets the deadline for v1.0 |
| Venue internet at the engagement | Ask for wifi details; print on QR card |
| Folder direct link | Optional link that opens a folder without PIN (long secret key, can be switched off). Recorded as proposed feature `folderDirectLink`, off by default; awaiting decision |
| Package contents and prices | Proposed Asas / Lengkap / Premium contents in D-046; prices and guest tiers to be set in the costing chat |
| Shared folder details | Can PIN holders who are not event guests also download a ZIP? (v1: no, single items only.) Should folder items ever be movable to the public gallery? (v1: no) |
| Trial limits and length | Proposal: 14 days, 20 guests, 100 uploads, 2 GB; confirm before building trials |
| Pricing and payment provider | Only if commercial; explored in a separate chat (cloud cost roughly RM 1.10 per GB of event data on Firebase; much lower with R2) |
| Large-video processing | Cloud Run job vs streaming ffmpeg (architecture pitfall M3) |
| Refresh shows nothing (phone test 2026-11-01) | Hidayah: an upload sometimes does not finish; after a refresh the page "shows nothing" and only closing and reopening the link continues the upload. D-090 fixes the stuck queue and the retry delay. Still unclear what "nothing" is (blank page, loading screen, menu without the queue bar). Suspect if it persists: IndexedDB not opening after a reload while the old page still holds it (no time limit on opening; known iOS Safari behaviour). Asked Hidayah for the phone, browser and what the screen shows |
| Theme templates (D chosen) | 2026-11-01: Hidayah chose theme direction D "Gerbang Blush" (C's arch layout in the Blush shawl colours) to build first. A, B, C and E are kept in `docs/product/themes/` for a later "template themes" page. Proposed, waiting for approval: a `template` key in `Theme` (`classic` = today's look, `gerbangBlush` = D; unknown or missing = `classic`), the paper and other neutrals come from the template and the accent stays per event; applied only after the code check; no rules or functions change; recorded as D-087 + ADR + design.md (partly superseding D-030's "only the accent changes"). Alternatives offered: blush as the default paper for everyone, or a free per-event paper colour **Resolved 2026-11-01: approved as D-087**, with changes (the name screen uses the template; CSS variables only) |

## 7. Glossary (Malay terms used in UI and data)

| Term | Meaning |
| --- | --- |
| Tunang / Pertunangan | Engagement |
| Nikah / Akad nikah | Solemnization (marriage contract ceremony) |
| Sanding / Bersanding | Wedding reception where the couple sits on the dais |
| Bertandang | Reception hosted by the groom's family |
| Kenduri | Feast, celebration |
| Berkat | Blessing; also the take-home gift at a kenduri |
| Peribadi / Awam | Private / Public |
| Galeri | Gallery |
| Snap Gambar | Snapshot |
| Muat Naik dari Galeri | Upload from Gallery |
| Ucapan Video | Video Wish |
| Telefon Pengantin | Call the Couple |
| Tulis Ucapan | Type a Wish |
| Hiasan | Decoration (frames, filters) |
| Folder Kongsi | Shared folder (private, PIN-protected) |
| Buat Folder / Masukkan PIN | Create folder / Enter PIN |
| Lapor Masalah | Report a problem |
| Makcik / Pakcik | Aunt / uncle; used for older guests generally |

## 8. Where things are

| Need | File |
| --- | --- |
| Rules for coding | `AGENTS.md` |
| Product spec | `docs/product/spec.md` |
| Design direction | `docs/product/design.md` |
| Code structure, pitfalls, spaces design | `docs/architecture/architecture.md` |
| Big decisions with full reasoning | `docs/decisions/` |
| Versioning policy and release notes | `docs/versions/` |
| What happened in each session | `docs/ai/worklog.md` |
| Phase prompts | `docs/ai/prompts/` |
| Setup | `docs/setup/start-here.md`, `docs/setup/new-computer.md` |

## 9. How to resume work (for a new AI or developer)

1. Read this file, then the top three entries of `worklog.md`.
2. Read `AGENTS.md` fully.
3. Check `VERSION` and `CHANGELOG.md` `[Unreleased]` for work in progress.
4. Ask the founder which phase or task to continue; propose a plan before coding.
