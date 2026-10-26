# Changelog

All notable changes to this project are documented here.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). Versions use the two-part `A.B` scheme described in [docs/versions/VERSIONING.md](docs/versions/VERSIONING.md). Detailed notes for each version are in [docs/versions/](docs/versions/).

## [Unreleased]

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

## [0.0] - 2026-10-25

### Added

- Project documentation baseline: README, AGENTS.md and CLAUDE.md, product spec and design direction, architecture with known pitfalls and multi-event spaces, versioning policy, AI memory and work log, decision records, setup guides and the Phase 0 prompt.
