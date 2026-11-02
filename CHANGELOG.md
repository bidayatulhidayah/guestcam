# Changelog

All notable changes to this project are documented here.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). Versions use the two-part `A.B` scheme described in [docs/versions/VERSIONING.md](docs/versions/VERSIONING.md). Detailed notes for each version are in [docs/versions/](docs/versions/).

## [Unreleased]

### Added

- Guests join an event from the QR link or by typing the 4-character code; the code disappears from the address bar after joining. Wrong codes show the same neutral screen for every case, with limits per phone, per network and per couple's space.
- Welcome screen with the couple's names and event title, then the guest's name and an optional selfie (big "Langkau" button). The name and selfie are remembered for the couple's other events on the same phone.
- Event menu with the functions the couple chose; capture tiles say "Akan datang" until they are built, and Galeri stays locked until the guest's first upload.
- "Majlis saya" lists the events joined on this phone; an event reopens instantly, even offline.
- Snap Gambar: take a photo with the phone's own camera straight from the menu; the photo is saved on the phone before it is sent.
- Muat Naik: send photos and videos from the phone gallery, several at once, any length up to 4 GB. A selection with a file over 50 MB asks once: upload now, or later on wifi.
- Nothing is lost on bad internet: items wait on the phone, send one at a time (photos first), retry by themselves, and continue after the page is reloaded; the menu shows what is waiting, sending, or needs attention.
- Galeri unlocks after the guest's first upload reaches the server.
- Privacy step: the first upload of an event asks Peribadi ("Hanya untuk pengantin") or Awam ("Kongsi di galeri"), and for Awam whether to show the guest's name; later uploads use a small switch on the menu that remembers the choice. Peribadi is the default.
- Muat Naik Saya (My Uploads): everything the guest sent to the event, with its status, a Peribadi / Awam switch, and delete; photos show a small preview. "Majlis saya" links to each event's uploads.
- Links opened inside Instagram, Facebook, Messenger, TikTok or LINE first offer to open in Chrome or Safari (with "Salin pautan"), or to continue there.
- If the camera does not open, "Kamera tidak terbuka?" shows how to allow it, or to continue without it; if the phone refuses storage, captures are kept in the open page and the guest is asked to keep it open.
- Snap Gambar can also record a video with the phone's own camera, at full quality and any length (up to 4 GB). The video is saved on the phone first; one over 50 MB asks whether to send now or later on wifi.
- After choosing "Teruskan di sini" inside Instagram, Facebook and similar apps, a small "Buka dalam Chrome" or "Buka dalam Safari" link stays at the top of every screen.
- The code, error and help screens have a small "Kembali" link.
- Every upload under way shows a progress circle: in Muat Naik Saya the file being sent shows its percentage over its preview and the files waiting their turn show a turning circle; the menu and the Snap Gambar screen show the circle with the percentage and how many are left.
- Tap a video in Muat Naik Saya to play it: the copy on the phone before it is sent, the guest's own uploaded video after.
- The Snap Gambar screen has a small "Muat Naik Saya (n)" link under the Gambar and Video buttons, with the number of the guest's items.

### Changed

- The event link opens faster on slow phones and networks: on a slow 4G connection the name screen appears about 1.4 seconds sooner, and less code loads before the first screen.
- App updates reach guests who keep the menu open: a new version is applied when they come back to the app, never while a photo is being saved or a gallery upload still needs the picked file.
- The QR link shows the name screen right away (about 2.5 s on a slow 4G phone, was about 4.5 s) while the code is checked in the background; the couple's names appear from the next screen.
- Muat Naik Saya is a compact grid of previews: small icons switch Peribadi / Awam, show or hide the name, or delete (still with a confirmation), and a corner mark shows whether each item is sent.

### Fixed

- Snap Gambar can record videos on phones: it now opens a screen with two big buttons, "Gambar" and "Video", each opening the phone camera in that mode. Before, Android phones opened photo mode only and iPhones varied. The screen stays open after a capture, so the next photo or video is one tap away.
- An upload that got stuck on a bad connection no longer stops everything behind it: a step that hangs is given up after 45 seconds, and an upload with nothing moving for a minute is restarted. Reloading the page, coming back to the app, or the phone coming back online now tries again at once.
- Video previews in Muat Naik Saya now also appear on iPhones (Safari showed only the placeholder).
- Muat Naik Saya shows a small preview for videos too (a frame near the start, with a play mark), and photo previews appear as soon as they are ready and stay after the item is sent. Items sent from another phone keep a plain placeholder for now.

## [0.1] - 2026-10-27

Phase 0: the empty but working skeleton. Details: [docs/versions/v0.1.md](docs/versions/v0.1.md).

### Added

- Design for shared folders (Folder Kongsi): guests create private folders and bulk-upload originals; visible only to the couple, the creator and PIN holders.
- Design for feature toggles, packages and add-ons: couples choose which functions guests get per event, priced by package and add-ons.
- Phase 0 skeleton: npm workspaces monorepo (`shared`, `web`, `functions`, `rules-tests`), TypeScript strict everywhere.
- Shared data model types, Firestore and Storage path builders, event entry parser (`tunang-K7Q2` → slug + code), permanent link vs alias detection, per-plan limits and the feature catalog with packages.
- Web app placeholder pages for every route (permanent link, alias, event entry, gallery, My events, login, admin, inactive alias), in Bahasa Melayu by default with a one-tap English switch.
- Design tokens (paper, ink, one olive accent), self-hosted Atkinson Hyperlegible and Instrument Serif, and the base Button, Tile and Screen components.
- Footer with copyright, app version and a "Lapor Masalah" placeholder.
- Installable app shell (PWA): works offline once opened; updates apply at the next screen change, never mid-screen.
- Firebase setup: deny-all security rules with tests, emulators for local work, a dev seed script, and a preview channel for testing on phones.
- Full product spec in `docs/product/spec.md`.

### Changed

- Node.js 24 for development and Cloud Functions (was 22).

## [0.0] - 2026-10-25

### Added

- Project documentation baseline: README, AGENTS.md and CLAUDE.md, product spec and design direction, architecture with known pitfalls and multi-event spaces, versioning policy, AI memory and work log, decision records, setup guides and the Phase 0 prompt.
