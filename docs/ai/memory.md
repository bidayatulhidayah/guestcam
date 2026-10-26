# Project memory

The single source of context for ANY AI assistant (or new developer) joining this project. Read this first, then the latest entries in `worklog.md`.

Maintenance rules:
- Update in the same commit whenever a decision is made or changed, the status moves, or a constraint appears.
- Never delete a decision. Mark it **Superseded by D-0xx** and add the new one.
- Keep facts here; keep session-by-session detail in `worklog.md`.
- No secrets, keys, event codes or guest personal data.

Last updated: 2026-10-26 (v0.0 + shared folders and feature toggles design, unreleased)

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
| Version | 0.0 (documentation baseline; no code yet) |
| Phase | Planning complete; Phase 0 (skeleton) next |
| Repo | GitHub, private, `guestcam` (to be created) |
| Hosting | Free Firebase domain (`<site>.web.app`) until after the friend's engagement |
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
| D-009 | Ordinary event videos come through Upload from Gallery (filmed with the phone's own camera): no length limit, 4 GB per-file cap, uploads open for 30 days after the event | Simpler and full quality; guests can send long videos from home |
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
| S-03 | In-app 1-minute live video recorder for normal clips | D-009 |
| S-04 | Host recorded greeting before voice messages | D-010 |
| S-05 | Manual sub-albums (Nikah, Resepsi) | D-015 |
| S-06 | Per-couple subdomains (`zaimhidayah.kenang.app`) | D-033 |
| S-07 | Space slugs never released / 2-year quarantine | D-035 |
| S-08 | Sequential public link IDs (`/s/1001`) | D-034 |
| S-09 | Original route `/:eventSlug-:code` with two params in one segment | D-036 and `shared/src/entry.ts` |
| S-10 | 4-digit space numbers (#0000, first other space #0001) | D-042 |
| S-11 | Seven-item menu without folders (D-007) | D-045 |

## 6. Open questions

| Question | Notes |
| --- | --- |
| Final product name | Favourite Kenang; check domain, Instagram handle, MyIPO trademark |
| Copyright footer owner line | Per event; default owner text undecided |
| Friend's engagement date | Sets the deadline for v1.0 |
| Venue internet at the engagement | Ask for wifi details; print on QR card |
| Folder direct link | Optional link that opens a folder without PIN (long secret key, can be switched off). Recorded as proposed feature `folderDirectLink`, off by default; awaiting decision |
| Package contents and prices | Proposed Asas / Lengkap / Premium contents in D-046; prices and guest tiers to be set in the costing chat |
| Shared folder details | Can PIN holders who are not event guests also download a ZIP? (v1: no, single items only.) Should folder items ever be movable to the public gallery? (v1: no) |
| Trial limits and length | Proposal: 14 days, 20 guests, 100 uploads, 2 GB; confirm before building trials |
| Pricing and payment provider | Only if commercial; explored in a separate chat (cloud cost roughly RM 1.10 per GB of event data on Firebase; much lower with R2) |
| Large-video processing | Cloud Run job vs streaming ffmpeg (architecture pitfall M3) |

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
