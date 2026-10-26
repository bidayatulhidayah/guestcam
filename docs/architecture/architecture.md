# Architecture and known pitfalls

Read with `docs/product/spec.md` and `docs/product/design.md`. Part 1 is the code structure; Part 2 lists bugs the current design would cause if built naively, with the fix and the phase where it must be handled.

## Part 1 — Code structure

npm workspaces monorepo: one install, shared types between app and functions.

```
guestcam/
  package.json              workspaces: web, functions, shared
  shared/                   types + constants used by BOTH web and functions
    src/types.ts            Event, Guest, Media, Wish, BugReport, enums
    src/paths.ts            Firestore + storage path builders (single source)
    src/entry.ts            parseEntry("zaimhidayah-k7q2") -> {slug, code}
    src/limits.ts           file caps, durations (15 min, 60 s silence...)
  web/
    src/
      app/                  App.tsx, router.tsx, providers
      config.ts             APP_NAME, feature flags
      i18n/                 index.ts, ms.json, en.json
      styles/               tokens.css (CSS variables), fonts/
      components/ui/        Button, Tile, Screen, Toggle, ProgressBar, Icon
      features/
        entry/              CodeEntryPage, EventGate (loads event, theme)
        onboarding/         NamePage, SelfiePage
        menu/               MenuPage
        capture/
          snapshot/         native-camera photo
          upload/           gallery picker
          boomerang/
          video-wish/
          call/             CallScreen, useVad, useCallTimers
          shared/           useRecorder, usePermissions, PrivacyStep
        wishes/             TypeWishPage
        gallery/            GalleryPage, MyUploadsPage, ItemView, useGalleryFeed
        bug-report/
        admin/              lazy-loaded chunk, never loaded by guests
      lib/
        firebase/           app.ts, auth.ts, firestore.ts (modular imports)
        storage/            StorageAdapter interface + firebaseStorage.ts
        queue/              Dexie db, queue runner, retry/backoff
        media/              exif.ts, preview.worker.ts, codecs.ts
        device/             inAppBrowser.ts, wakeLock.ts, storagePersist.ts
    tests/                  Vitest unit tests
  functions/
    src/
      index.ts              exports only
      triggers/             onUploadFinalized, onMediaWrite
      media/                images.ts (sharp), video.ts, boomerang.ts, voice.ts, metadata.ts
      storage/              server-side StorageAdapter
      admin/                setRole, createEvent, regenerateCode, exportEvent
      counters/             sharded counters, limit switch
      cleanup/              orphan files, retention, abandoned anonymous users
  firestore.rules
  storage.rules
  rules-tests/              security rules tests against the emulator
  firebase.json
```

Principles:
- **Feature folders**: each feature owns its pages, hooks and strings; shared UI lives in `components/ui`.
- **Types and paths in `shared/`**: the app and functions can never disagree on a field name or a storage path.
- **Screens never call Firebase directly** for files (storage adapter) or for queries used in more than one place (put them in `lib/firebase`).
- **Security rules have their own tests**; privacy bugs are the most damaging bugs in this app.

## Part 2 — Known pitfalls in the current design

Severity: **High** = privacy leak, data loss or broken core flow. **Med** = visible bug at events. **Low** = edge case.

### Routing and entry

| # | Pitfall | Sev | Fix | Phase |
| --- | --- | --- | --- | --- |
| R1 | React Router cannot match `/:eventSlug-:code` (two params in one segment), and slugs may contain hyphens (`zaim-hidayah`) | High | One param `/:entry`, parsed by `shared/entry.ts`: split on the LAST hyphen, code must match `^[a-hj-km-np-z2-9]{4}$` | 0 |
| R2 | A slug ending in "-" + 4 code-like characters is ambiguous | Low | Slug validation in admin rejects that pattern | 4 |
| R3 | Case: printed code K7Q2 vs URL k7q2 | Med | Normalise to lowercase everywhere; compare case-insensitively | 0 |
| R4 | Slugs colliding with app files or routes (`assets`, `sw.js`, `manifest.webmanifest`, `gallery`, `mine`) | Med | Extend the reserved list; Hosting serves static files before the SPA rewrite | 0 |
| R5 | Two hosts claim the same slug at once | Low | `slugs/{slug}` document created in a transaction | 4 |

### Guest identity

| # | Pitfall | Sev | Fix | Phase |
| --- | --- | --- | --- | --- |
| I1 | QR opened inside WhatsApp / Instagram / Facebook in-app browser: camera and mic often blocked on iOS, and storage is separate from Safari/Chrome, so "My Uploads" disappears later | High | Detect in-app browsers; show "Buka dalam Safari / Chrome" with one-tap copy link before onboarding | 1 |
| I2 | Anonymous user lost (cleared data, other browser, home-screen PWA has separate storage on iOS) | Med | Accept as known; My Uploads tied to device. Show a gentle note. Optional later: 4-digit personal recovery PIN | 1 |
| I3 | Thousands of abandoned anonymous accounts | Low | Enable Firebase automatic clean-up of anonymous accounts after the upload window | 5 |

### Uploads and the queue

| # | Pitfall | Sev | Fix | Phase |
| --- | --- | --- | --- | --- |
| U1 | Retry after the network drops creates duplicate items (upload finished, response lost) | High | Client generates `mediaId` (UUID) at capture; it is both the doc ID and the storage path. All writes idempotent | 1 |
| U2 | Doc exists but file missing (broken tile), or file exists but doc missing (orphan, costs money) | High | Create doc with `status: queued` first; gallery shows only `status == ready`; functions set `ready`; daily clean-up deletes orphans and stale `queued` docs | 1 |
| U3 | Firebase JS SDK resumable upload does NOT survive a page reload: it restarts from zero | High | Queue restarts the file automatically and shows "Menyambung semula"; warn guests to keep the page open for large files; true cross-reload resume arrives with the R2 adapter (multipart) | 1 |
| U4 | IndexedDB quota exceeded (iPhone limits) throws and the capture is lost | High | Catch `QuotaExceededError`; upload directly from memory with a warning; request persistent storage | 1 |
| U5 | Large gallery files copied into IndexedDB double storage use | Med | Gallery uploads stream from the original File; if interrupted, ask the guest to re-pick | 1 |
| U6 | Storage rule size cap missing: a 20 GB file is accepted | Med | `request.resource.size < 4 GB` and allowed content types in `storage.rules` | 1 |

### Media processing

| # | Pitfall | Sev | Fix | Phase |
| --- | --- | --- | --- | --- |
| M1 | Storage trigger fires again for the thumbnails it writes: infinite loop and runaway bill | High | Trigger only on `/original/` paths; derived files go elsewhere; function checks path prefix first | 3 |
| M2 | Function retries process the same file twice | Med | Idempotent: skip if derived file already exists or doc already `ready` | 3 |
| M3 | A 2-4 GB video does not fit: Cloud Functions `/tmp` is in memory | High | Small files in Functions; large videos via a Cloud Run job with disk, or stream ffmpeg from a signed URL; set per-type size thresholds | 3 |
| M4 | iPhone HEVC `.mov` and Chrome `webm` do not play on every phone | High | Always transcode display copies to H.264 MP4 + AAC; posters as WebP | 3 |
| M5 | HEIC photos do not display in Chrome/Android | Med | sharp built with HEIF support makes JPEG/WebP display copies; original HEIC kept for download | 3 |
| M6 | Sideways photos (EXIF orientation) | Med | `sharp().rotate()` auto-orients derived copies; original untouched | 3 |
| M7 | Raw EXIF (MakerNote) can exceed Firestore's 1 MB document limit | Med | Store a whitelist of EXIF fields only | 3 |
| M8 | EXIF dates have no time zone; overseas photos sort wrongly | Low | Use `OffsetTimeOriginal` when present; else assume event time zone | 3 |
| M9 | Wrong phone clock makes in-app captures sort oddly | Low | `uploadedAt` is always a server timestamp; flag captures more than a day away from server time | 3 |

### Privacy and security rules

| # | Pitfall | Sev | Fix | Phase |
| --- | --- | --- | --- | --- |
| P1 | **Firestore rules cannot hide one field.** In the current model `location` sits inside the media doc, so any guest who can read a public item can read its GPS | High | Move location and raw EXIF to `media/{id}/private/meta`, readable only by hosts | 1 |
| P2 | "Anonymous" public items still carry `guestId` → name can be looked up | High | Media docs store only `ownerUid` (a random ID, needed for My Uploads queries), never a name. `guests/{uid}` is readable only by that guest and hosts, so the ID cannot be turned into a name. When `showName` is true, a function copies the display name and selfie thumbnail into the media doc | 1 |
| P3 | Gallery lock and reveal time enforced only in the app; anyone can query Firestore directly | High | Enforce in rules: guest doc `galleryUnlocked == true` and `request.time >= revealAt` (or live mode) | 3 |
| P4 | Rules are not filters: a gallery query without `visibility == "public"` and `hidden == false` is rejected | Med | Queries always include both conditions; matching composite index | 3 |
| P5 | Storage rules for originals of private items | High | Originals readable only by owner and hosts; public originals readable by event members | 1 |
| P6 | Code leaks and strangers upload | Med | App Check, per-guest rate limits in a function, host can regenerate code | 5 |
| P7 | Host role granted but not active | Low | Force ID token refresh after setting custom claims | 4 |

### Capture, voice and phone APIs

| # | Pitfall | Sev | Fix | Phase |
| --- | --- | --- | --- | --- |
| C1 | Camera/mic/audio only start after a tap on iOS; beeps silently fail | High | Start recording and create the AudioContext inside the button's tap handler; preload beep sounds there | 2 |
| C2 | iOS stops recording when the screen locks or the guest switches apps | High | Listen for `visibilitychange`; finalise and save the chunks so far; show "Panggilan terputus, rakaman disimpan" | 2 |
| C3 | Wake Lock missing on older iPhones | Low | Fallback: hidden silent looping video | 2 |
| C4 | Vibration does nothing on iPhone | Low | Treat as optional; visual and sound feedback always present | 2 |
| C5 | onnxruntime multithreading needs cross-origin isolation headers that can break other features | Med | Use single-threaded WASM for VAD; no COOP/COEP headers | 2 |
| C6 | Permission denied leaves the guest stuck | High | Clear recovery screen per browser with steps to re-enable, plus "Teruskan tanpa" options | 1 |
| C7 | MediaRecorder formats differ (Safari mp4, Chrome webm) | Med | Detect supported type with `isTypeSupported`; functions normalise | 2 |

### PWA, i18n, admin

| # | Pitfall | Sev | Fix | Phase |
| --- | --- | --- | --- | --- |
| A1 | Stale service worker: guests at the event run an old version after a fix is deployed | High | Never cache `index.html` long; on new version, update at the next screen change, not mid-capture; version shown in footer and bug reports | 0 |
| A2 | Cached event theme never updates after host edits it | Med | Stale-while-revalidate for event data; theme versioned | 1 |
| A3 | Missing key in `en.json` shows the raw key | Low | Unit test: `ms.json` and `en.json` have identical keys | 0 |
| A4 | Deleting an event leaves subcollections and files behind | Med | Recursive delete function for events | 4 |
| A5 | Global limit race: many uploads cross the threshold at once | Low | Soft limit; switch is set by a function, small overshoot accepted | 4 |

## Must-have tests

- Security rules tests (emulator): private items, location subdoc, gallery lock, reveal time, owner-only writes, size caps.
- `parseEntry` unit tests: hyphenated slugs, uppercase codes, invalid codes, reserved slugs.
- Queue tests: retry, duplicate prevention, quota error, restart after reload.
- i18n key parity test.
- Manual device matrix each phase: iPhone Safari, iPhone via WhatsApp link, mid-range Android Chrome, Android via Instagram link.

## Part 3 — Multi-event spaces and addresses

A **space** is one couple (or host). It holds several fully separate **events** (e.g. engagement, solemnization, reception, homecoming reception), each with its own date, theme, code, guests, gallery and settings.

### Two kinds of address

| Address | Lifetime | Used for |
| --- | --- | --- |
| `/s/:publicId` e.g. `/s/7k3qmx` | Permanent, never changes | Printed QR codes, "My events", host dashboard, everything after the event |
| `/:aliasName` e.g. `/zaimhidayah` | Active only inside a booked time window, then free for other spaces | Typing by hand and announcements during the event |

- Path-based on ONE origin (no per-couple subdomains): a guest keeps the same identity whether they arrive by QR or by typing the alias; no 20-subdomain Firebase limit; works today on `<site>.web.app`.
- Two identifiers per space, each for its own job:
  - `publicId` (in links): 7 random chars from the code alphabet (`a-h j-k m-n p-z 2-9`), generated once, never changes. Not guessable, so spaces cannot be enumerated.
  - `spaceNumber` (internal only): 5 digits, zero-padded, never changes. Used in the admin dashboard, invoices, support and audit logs. NEVER appears in a URL or guest UI.
    - `00000`: founder's own space (Zaim & Hidayah, alias `zaimhidayah`), plan `internal`.
    - `00001`: public marketing demo, plan `demo`.
    - `00002`-`09999`: internal test, staging and screenshot spaces, assigned manually by the super admin.
    - `10000`: reserved, never assigned.
    - `10001` onward: real spaces from the server counter (`counters/spaces.nextClientNumber`, transaction; space creation is rare, so one counter doc is fine). `10001` = the friend's engagement (plan `beta`). Trials and paid clients share this sequence, so a trial keeps its number when it converts.
  - `plan`: `internal | demo | beta | trial | paid`, shown as a label next to the number ("#10012 · Trial"). See Part 4.
- Defence in depth: `/s/:publicId` WITHOUT a valid code still shows only a neutral code screen (no display names, title or theme). Space details appear only after `joinEvent` succeeds, or on an alias during its active window.
- Alias names may not be all digits, so ids and aliases never collide.
- The alias is served in place (no redirect), so the address bar stays clean during the event.

### Alias bookings

- Each booking: `{ aliasName, spaceId, eventId, activeFrom, activeUntil }`.
- Default window: 00:00 (event time zone) on the event day → event end + 24 h. Hosts or the super admin can set an earlier `activeFrom` for special cases.
- No scheduler: on each visit the server finds a booking for that name where `activeFrom <= now <= activeUntil`.
- Overlapping bookings for the same name are rejected; the conflict is flagged to the super admin to resolve manually (expected to be rare).
- Outside any window, the alias shows a neutral page ("Pautan ini tidak aktif. Imbas kod QR pada kad anda atau log masuk.") with no couple information.
- Format: lowercase `a-z0-9`, 4-30 chars, not all digits, not reserved. When busy at that time, admin suggests alternatives (swapped order, `dan`, year, place).

### Routes (relative to the site root)

| Path | Behaviour |
| --- | --- |
| Active `/:aliasName`, or `/s/:publicId` for a device that is already a member | Server resolves the **current event**: happening today (start -12 h to end +12 h) → next upcoming within 7 days → most recent still within its upload window → couple-names landing page |
| `.../:eventEntry` (QR: `/s/7k3qmx/tunang-k7q2`) | With a valid code: `joinEvent`, then `history.replaceState` to `.../tunang`. Without: menu if member, else the generic code screen |
| `.../:eventSlug/gallery` | Event gallery (lock and reveal rules still apply) |
| `/mine` | Events this device has joined (always via permanent links) |
| `/login`, `/admin` | Host login and dashboard; super-admin tools |

Fixed routes are English. Event slugs and alias names are host-chosen data and may be Malay.

### Naming rule

All code and backend names are English: collections, fields, enums, functions, files, routes. Malay appears only in UI strings (`ms.json`) and host-entered data. Event type enum: `engagement | solemnization | reception | other`; the guest-facing title is set per event by the host.

### Data model

```
spaces/{spaceId}              publicId (random, unique, permanent), spaceNumber ("00000", internal), plan, trialEndsAt?, displayNames, defaultTheme, createdAt
  hosts/{uid}                 role: owner | moderator, addedAt, addedBy
publicIds/{publicId}          spaceId                              (unique; transaction)
counters/spaces               nextClientNumber (starts 10001)      (server only)
aliasBookings/{bookingId}     aliasName, spaceId, eventId, activeFrom, activeUntil, createdBy
events/{eventId}              spaceId, eventSlug, type, title {ms, en}, startAt, endAt,
                              uploadUntil, theme (overrides space default), galleryMode, revealAt, status
  private/access              code, linkedEventIds[]               (server only)
  members/{uid}               joinedAt                             (written only by joinEvent)
  guests/{uid}                (as before)
  media/{mediaId}             (as before; private/meta subdoc)
  wishes/{wishId}             (as before)
auditLog/{entryId}            spaceId, eventId, uid, action, target, at   (hosts read; server writes)
```

- `events` stays top-level with `spaceId`.
- Host roles are per space in Firestore (`spaces/{id}/hosts/{uid}`), checked in rules with `exists()`. Custom claims only for `superadmin`.
- Roles: **owner** (each partner has their own account; full access incl. private items, export, settings, delete) and **moderator** (optional helper: hide/unhide public items only).

### Server functions

- `resolveSpace(pathSegment)` → space for `/s/:publicId` or an alias active now; else "inactive".
- `resolveCurrentEvent(spaceId)` → `{ eventSlug, title, theme }` only. Never returns dates, venue or the event list.
- `joinEvent(spaceId, eventSlug, code)` → checks code (rate-limited: 5 tries then wait, per device and per IP), writes `members/{uid}` for the event and any linked events.
- `bookAlias(spaceId, eventId, aliasName, window?)` (owner or super admin) → rejects overlaps, flags conflicts, returns suggestions when busy.

### Privacy rules for spaces

| Risk | Rule |
| --- | --- |
| Strangers learning dates/venues | Public view = display names + current event title + theme, and for aliases only inside the active window |
| Discovering events by guessing `/nikah` | Unknown and non-joined events return the same generic code screen |
| One code opening all events | Membership is per event; linking events is an explicit host choice |
| Code leaking via shared links/screenshots | Code removed from the URL after joining |
| Alias reused by another couple later | Old visitors reach the new space's code screen; event codes never carry over; printed QRs use permanent links so they never break |
| Browsing or counting couples | Link ids are random; the sequential `spaceNumber` never leaves the admin side; permanent links show only a neutral code screen until a valid code is entered; aliases reveal nothing outside their window |
| Who did what | All host actions (hide, delete, export, settings, alias booking) written to `auditLog` |

### Domain independence

- The public domain lives in ONE setting: `VITE_PUBLIC_BASE_URL` (web) and the `PUBLIC_BASE_URL` parameter (functions). No domain is written in code.
- Firestore stores ids and relative paths only (`publicId`, `eventSlug`), never full URLs. QR codes, share links and exports build URLs from the setting at the time they are generated.
- Switching domain: connect it in Firebase Hosting → add it to Firebase Auth authorised domains and App Check → change the setting → redeploy.
- The old domain keeps serving the app with NO automatic redirect, so printed QR codes keep working and guests keep their device data (browser storage is per domain). Only the bare root `/` redirects to the new domain.

## Part 4 — Plans, public demo and client trials

Planned for after v1.0. The `plan` field and plan-based limits exist from Phase 0 so no migration is needed later.

### Plans

| Plan | Who | Limits (initial proposal) |
| --- | --- | --- |
| `internal` | Founder's spaces and test spaces (`00000`, `00002`-`09999`) | None |
| `demo` | Public marketing demo (`00001`) | Photos and video wish up to 30 s only; a few items per visitor; rate limits; uploads auto-deleted after 24 h; "DEMO" label |
| `beta` | Free early real events (`10001` = friend's engagement) | Same as paid |
| `trial` | Potential clients | e.g. 14 days, 20 guests, 100 uploads, 2 GB, "Percubaan" watermark |
| `paid` | Paying clients | By package (pricing decided separately) |

Limits live in one table in `shared/src/limits.ts`, keyed by plan, and are enforced by functions and security rules (size caps), never only in the UI.

### Public demo (`/demo`, space `00001`)

- A sample couple ("Majlis Contoh"), always live, with a curated gallery so it looks real.
- Visitors see only their own uploads plus the curated gallery; strangers' uploads are never shown to other strangers.
- Demo storage path has a lifecycle rule deleting files after 24 h; demo docs deleted by a daily cleanup.
- "Lihat sebagai pengantin" opens a read-only host dashboard filled with sample data.
- Reached from the marketing homepage at the site root ("Cuba demo").

### Client trial

- Created by the super admin from `/admin` ("Create trial", about 2 minutes): client names, accent colour from their invitation card, cover photo, one event, trial length.
- The client receives their QR, permanent link and an invite to their own host login.
- Super admin sees a simple activity view per trial (opened, uploads, last active) to follow up.
- Conversion: change `plan` to `paid`; same number, link, QR and data.
- Expiry: read-only for 7 days with an upgrade prompt, then deleted after notice. The client accepts this when the trial is created.

## Part 5 — Shared folders (Folder Kongsi)

Replaces AirDrop and WhatsApp for sharing many photos with the couple (e.g. a relative's camera, a group of friends). The couple receives everything automatically, in original quality with metadata.

### Behaviour

- **Create:** any event member creates a folder with a name (e.g. "Kamera Pak Long"), then adds photos and videos: multi-select, originals, no length limit, same upload queue as everything else.
- **PIN:** the server generates a 6-digit PIN (crypto-random; never trivial like 000000 or 123456), shown large with a folder link `.../:eventSlug/f/:folderId` (`folderId` = 10 random chars).
- **Who can see:** the couple (space `owner` role), the folder creator, and anyone who entered the PIN. Moderators cannot. Folder items never appear in the public gallery and cannot be made public (v1).
- **What PIN holders can do:** view, download single items, and add photos/videos (contributors). Only the creator and owners can rename, reset the PIN, remove others' items or delete the folder. Every uploader can delete their own items.
- **Folder link alone reveals nothing:** it shows a PIN screen with no name, count or thumbnails. A folder PIN opens that folder only, never the event; PIN holders do not need the event code.
- **Sharing:** one "Kongsi" button (Web Share API) sends the link and PIN in one message, which is simplest for all ages. The creator or owners can reset the PIN anytime, optionally removing everyone who joined with the old PIN.
- **Adding more later:** re-picking a set uploads only new files (per-folder fingerprint of name + size + lastModified), with progress such as "120/300".
- **Gallery unlock:** for event members, uploading to a folder counts as their first upload.
- **Upload window:** same as the event (`uploadUntil`, default 30 days after).
- **Downloads:** single items for everyone with access; "Muat turun semua" (ZIP) for owners and the creator.
- **Host dashboard:** a Folders tab per event (name, creator, items, size, last activity) with open, download ZIP, reset PIN, delete. The full event export keeps the folder structure (`folders/<folder name>/...`).
- **Host settings:** folders on/off per event; max folders per guest (default 5); plan limits apply. Empty folders are deleted after 24 h.

### Data model

```
events/{eventId}/folders/{folderId}   name, ownerUid, ownerName, createdAt, lastActivityAt,
                                      itemCount, sizeBytes, coverThumbPath, pinVersion, status (active|deleted)
  private/access                      pin, failedAttempts, lockedUntil      (read: creator + space owners; write: server)
  members/{uid}                       role (creator|contributor), joinedAt, pinVersion   (write: server only)
  media/{mediaId}                     same Media shape as event media + folderId; private/meta subdoc as usual
```

Storage: `events/{eventId}/folders/{folderId}/{uid}/original/{mediaId}` (+ `display/`, `thumb/`).

Folder media live in a **subcollection under the folder**, not as a field on event media: security is enforced by path (`match /folders/{folderId}/{document=**}`), so no gallery query can ever return folder items, and rules stay simple to test. Storage rules check folder membership with `firestore.exists()`.

### Server functions

- `createFolder(eventId, name)`: event members only; creates the folder, the PIN and the creator's member doc; enforces the per-guest folder limit.
- `joinFolder(eventId, folderId, pin)`: rate limits of 5 failed tries per device per 15 min, 20 per IP per hour, 50 per folder per day (then the PIN locks and the creator and owners are notified to reset it). Writes `members/{uid}` with the current `pinVersion`.
- `resetFolderPin(folderId, removeMembers)`: creator or owners; new PIN and `pinVersion + 1`. With `removeMembers`, people who joined with the old PIN lose access (rules compare `pinVersion`).
- `zipFolder(folderId)`: owners or creator; Cloud Run job for large folders; signed download link valid 24 h.
- Media processing triggers also fire on `/folders/{folderId}/.../original/` paths (same idempotency rules).

### Security rules (summary)

- Read folder doc and its media: space owners, or a member whose `pinVersion` equals the folder's `pinVersion`. Moderators and other guests: denied.
- Create media: members only, under their own uid path, before `uploadUntil`, within plan size caps.
- Delete media: the uploader, the folder creator, or owners.
- `private/access`: readable by the creator and owners only; written only by functions.
- Required rules tests: valid folder link without PIN is denied; member with an old `pinVersion` is denied after a reset with removal; folder items never returned by gallery queries; moderator denied; non-member upload denied.

### Pitfalls

| # | Pitfall | Sev | Fix |
| --- | --- | --- | --- |
| F1 | PIN brute force (1,000,000 combinations) | High | Server-side check, three rate limits, lockout, App Check |
| F2 | A 300-photo batch is interrupted and must be re-picked | Med | Fingerprints so re-picking uploads only missing files; clear progress |
| F3 | Phone pickers strip location or convert HEIC | Low | Store what survives (same as M5, `location.source`) |
| F4 | Large ZIP downloads cost bandwidth | Med | ZIP only for owners and creator; cached 24 h; free egress after the R2 move |
| F5 | Link and PIN forwarded beyond the intended group | Low | Expected behaviour of a shared PIN; reset with removal; owners see who joined |
| F6 | Folder spam | Low | Max folders per guest; empty folders auto-deleted; owners can delete |

## Part 6 — Feature toggles, packages and pricing

Couples choose which functions their guests get, and pay according to what they choose. Two layers decide whether a function is available:

```
effective feature = ENTITLED (paid for, per space)  AND  ENABLED (switched on by the host, per event)
```

- **Entitled:** set by the package and add-ons the couple bought. Only the super admin (or later a payment function) can change it.
- **Enabled:** owners switch entitled features on or off for each event (e.g. the nikah without Boomerang, the reception with everything).
- Guests only ever see effective features: menu tiles for disabled functions disappear and the grid reflows.
- At least one capture function must stay enabled per event.

### Feature catalog (`shared/src/features.ts`)

One typed list of feature keys, used by the web app, functions and rules tests:

| Key | Function | Cost driver |
| --- | --- | --- |
| `snapshot` | Snap Gambar | Low |
| `galleryUpload` | Muat Naik dari Galeri | Medium to high (long videos) |
| `textWish` | Tulis Ucapan | Very low |
| `videoWish` | Ucapan Video | High |
| `voiceCall` | Telefon Pengantin | Low (voice is small) |
| `boomerang` | Boomerang | Medium (processing) |
| `sharedFolder` | Folder Kongsi | High (bulk originals) |
| `publicGallery` | Shared gallery (live or after event) | Bandwidth |
| `decoration` | Frames and filters | Processing |
| `nameStamp` | Name stamp | Processing |
| `customTheme` | Accent colour, cover, monogram from the invitation card | None |
| `cleanAlias` | Clean address during the event (`/zaimhidayah`) | None |
| `multiEvent` | More than one event per space | Per event |
| `moderatorRole` | Helper accounts | None |
| `fullExport` | ZIP of everything + metadata CSV/JSON | Bandwidth |
| `extendedStorage` | Keep data longer than the package default | Storage |

Proposed, pending decision: `folderDirectLink` (folder link that opens without PIN, off by default).

### Packages and add-ons

Package names and contents are a starting proposal; prices are decided in the separate costing work and stored as data, not code.

| Package | Includes |
| --- | --- |
| **Asas** (Basic) | snapshot, galleryUpload, textWish, publicGallery, customTheme |
| **Lengkap** (Complete) | Asas + videoWish, voiceCall, boomerang, nameStamp |
| **Premium** | Lengkap + sharedFolder, decoration, cleanAlias, multiEvent, moderatorRole, fullExport |
| **Custom** | Any combination set by the super admin |

- **Add-ons:** any single feature not in the package can be added (e.g. Asas + Telefon Pengantin), plus quantity add-ons: extra events, extra guests, extended storage.
- **Price** = package price for the guest tier + add-ons. Guest tiers and amounts: costing chat.
- **Plans vs packages:** `plan` (internal, demo, beta, trial, paid) is the lifecycle; `package` is what is included. Internal, demo and trial spaces are entitled to everything (with plan limits); beta follows whatever is agreed.

### Data model

```
catalog/current         features[], packages{ key: { features[], limits, priceByGuestTier } },
                        addOns{ key: { feature?, quantity?, price } }, currency "MYR",
                        catalogVersion                          (write: super admin; read: anyone, for the pricing page)
spaces/{spaceId}        plan, package, addOns[], entitlementOverrides{},
                        entitlements{ featureKey: true }        (computed by a function; write: server only)
  purchases/{id}        package, addOns, guestTier, priceSnapshot, catalogVersion, paidAt, invoiceNo
events/{eventId}        enabledFeatures{ featureKey: bool }     (write: owners)
                        featureChangedAt{ featureKey: timestamp }
```

- Prices are stored in sen (integers), never floats.
- Every purchase stores a **price snapshot**, so later catalog changes never alter what a couple already paid for.

### Enforcement

- **UI:** reads `space.entitlements` and `event.enabledFeatures`; hides disabled tiles; host settings show locked features with a "Naik taraf" (upgrade) label and price.
- **Security rules:** creating media of a type requires `entitlements[feature] == true` on the space AND `enabledFeatures[feature] == true` on the event. Hosts can write `enabledFeatures` only for keys present in `entitlements`.
- **Functions:** `joinFolder`, `bookAlias`, `zipFolder`, export and decoration check entitlements too.
- **Rules tests:** a guest cannot upload a voice call when `voiceCall` is off; a host cannot enable a feature the space is not entitled to.

### Changing features mid-way

- **Upgrade:** the new feature is available immediately after payment (or after the super admin sets it).
- **Switching off during an event:** existing items stay. Items captured before the switch-off (`capturedAt < featureChangedAt`) may still upload for 24 h, so nothing already on a guest's phone is lost.
- **Downgrade or expiry:** never deletes content; it only stops new captures of that type.

### Pitfalls

| # | Pitfall | Fix |
| --- | --- | --- |
| T1 | Feature checked only in the UI | Rules and functions enforce entitlements and toggles |
| T2 | Host switches a feature off while guests have queued items | 24 h grace for items captured before the change |
| T3 | Catalog price change affects existing clients | Price snapshot per purchase |
| T4 | Feature keys drift between web, functions and rules | Single `features.ts` in `shared/`; rules tests iterate over the catalog |
| T5 | Every feature switched off | Host settings require at least one capture feature |
