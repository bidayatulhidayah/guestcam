# guestcam

**A guest camera for weddings and celebrations.** Guests scan a QR code and, with no app to install and no account, take photos, record wishes, "call the couple" with a voice message, and share moments, privately with the couple or publicly in a shared gallery.

> `guestcam` is the project codename. The product name is not final (working name: Kenang).

Status: **v0.0 released; Phase 0 skeleton (v0.1) in progress, unreleased.** Placeholder pages, tooling and tests only; no guest features yet. See [CHANGELOG.md](CHANGELOG.md).

---

## Features (planned for v1.0)

**For guests**
- Scan a QR code and start in three screens: name, optional selfie, menu
- **Snapshot**: full-resolution photos with the phone's own camera
- **Upload from Gallery**: photos and videos already on the phone, any length
- **Video Wish** and **Boomerang**
- **Call the Couple**: a voice wish recorded like a phone call, clear even in a loud hall
- **Type a Wish**, with an optional photo
- **Shared folders**: create a private folder and send many photos at once (no more AirDrop); only the couple and people with the folder PIN can open it
- **Private or public** for every item; private by default
- Gallery unlocks after the guest's first upload; sorted by when each moment was captured
- Bahasa Melayu by default, English one tap away
- Works on weak venue internet: everything is saved on the phone first and uploaded in the background

**For couples (hosts)**
- One space per couple with several separate events (engagement, solemnization, reception...), each with its own theme, code and gallery
- A clean address during the event (e.g. `/zaimhidayah`) and permanent QR codes that never break
- Theme from the couple's invitation card: one accent colour, cover photo, frames
- Moderation, bug reports from guests, full export with metadata
- Choose which functions guests get, per event, from packages and add-ons
- Separate accounts for each partner, optional helper role, audit log

## Tech stack

| Layer | Choice |
| --- | --- |
| Language | TypeScript (strict) |
| Front end | React + Vite, PWA, Tailwind CSS, React Router, i18next |
| Offline queue | IndexedDB (Dexie) |
| Backend | Firebase: Anonymous Auth, Firestore, Storage, Cloud Functions, Hosting, App Check (region asia-southeast1) |
| Media processing | sharp (images), ffmpeg / ffprobe (video, boomerang, voice) |
| Voice detection | Silero VAD in the browser |
| Tooling | npm workspaces monorepo, conda environment, Firebase Emulator Suite |

Why these choices: [docs/decisions/](docs/decisions/).

## Repository structure

```
guestcam/
├── README.md              this file
├── AGENTS.md              rules for any AI coding assistant (canonical)
├── CLAUDE.md              imports AGENTS.md for Claude Code
├── CHANGELOG.md           version history (Keep a Changelog)
├── VERSION                current version (A.B)
├── LICENSE
├── environment.yml        conda environment (Node 24, Java 21, ffmpeg, git, gh, Python)
├── shared/                types, paths, URL parsing, limits (web + functions)   [Phase 0]
├── web/                   React PWA: guest app and /admin                       [Phase 0]
├── functions/             Cloud Functions: media processing, admin, cleanup     [Phase 0]
├── rules-tests/           Firestore and Storage security rules tests            [Phase 0]
├── scripts/               seed and maintenance scripts
└── docs/
    ├── README.md          documentation index
    ├── product/           spec.md, design.md
    ├── architecture/      architecture.md (structure, known pitfalls, spaces)
    ├── decisions/         Architecture Decision Records (ADRs)
    ├── versions/          versioning policy and detailed release notes
    ├── ai/                memory.md, worklog.md, prompts/
    └── setup/             start-here.md, new-computer.md
```

## Getting started

Full checklist: [docs/setup/start-here.md](docs/setup/start-here.md).

**Prerequisites:** Miniconda, Git, a Firebase project on the Blaze plan (region asia-southeast1), and a GitHub account.

```bash
# 1. Environment (Node 24, Java 21, ffmpeg, gh, Python)
conda env create -f environment.yml
conda activate guestcam

# 2. Tools
npm install -g firebase-tools
firebase login
gh auth login

# 3. Code
gh repo clone <owner>/guestcam
cd guestcam
npm ci                         # all workspaces, one lock file
cp web/.env.example web/.env.local   # then fill in the Firebase config
```

**Run locally:**

```bash
npm run emulators              # Auth, Firestore, Storage, Functions, Hosting (UI: localhost:4000)
npm run seed                   # second terminal, once: spaces #00000, #00001, #10001
npm run dev                    # web app against the emulators (localhost:5173)
npm test                       # unit tests + security rules tests
```

Phone cameras need HTTPS, so test on real phones through a Firebase Hosting preview channel:

```bash
npm run deploy:preview
```

## Documentation

| Read | For |
| --- | --- |
| [docs/product/spec.md](docs/product/spec.md) | What the product does |
| [docs/product/design.md](docs/product/design.md) | How it looks and feels |
| [docs/architecture/architecture.md](docs/architecture/architecture.md) | How it is built, and the pitfalls to avoid |
| [docs/decisions/](docs/decisions/) | Why key decisions were made |
| [docs/ai/memory.md](docs/ai/memory.md) | Full project context and decision log |
| [docs/ai/worklog.md](docs/ai/worklog.md) | What changed in each work session |

## Versioning and contributions

- Versions use **`A.B`** (major.minor), tagged `vA.B`. Policy: [docs/versions/VERSIONING.md](docs/versions/VERSIONING.md).
- Commits follow [Conventional Commits](https://www.conventionalcommits.org/) (`feat:`, `fix:`, `docs:` ...).
- `main` is always deployable; work happens on `feat/...` and `fix/...` branches merged by pull request.
- AI-assisted work must follow [AGENTS.md](AGENTS.md), including the work log and memory updates.

## Privacy

Guests' photos are private to the couple by default. Location data is never shown to guests. Events are protected by per-event codes checked on the server. Details: [docs/architecture/architecture.md](docs/architecture/architecture.md).

## License

Proprietary. Copyright (c) 2026 Hidayah. All rights reserved. See [LICENSE](LICENSE).
