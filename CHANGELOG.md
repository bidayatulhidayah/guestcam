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
