# Wedding Guest Camera — Project Spec

Oct 25, 2026 · @hidayah

## Overview

A mobile web app where guests scan a QR code, take photos, boomerangs and video wishes, leave voice and text wishes, and view and download the event gallery. No app install, no account. It is built once as a multi-event platform: first tested at a friend's engagement, then reused for Hidayah's own wedding by creating a new event, not changing code.

**Design principles**

- Clean and simple enough for guests of every age to use the basic functions without help.
- Bahasa Melayu by default, English one tap away (small EN button in the corner).
- Big buttons with icon plus a short word; large, high-contrast text.
- Two taps maximum from the menu to capture anything; everything is a tap, no gestures to learn.
- One question per screen; clear feedback after every action (Berjaya dihantar / Sedang dihantar).
- Original quality and full metadata are kept for every file.
- Connectivity, not storage, is the main constraint: nothing a guest captures is ever lost.

**Scale targets:** 1,000 guests, up to 200 using the app at the same moment.

## Name candidates

Current favourite: **Kenang**, domain **kenang.app**. Backups: kenang.my, then kenangannya.com. Final choice pending a domain, Instagram handle and MyIPO trademark check.

- Welcome screen: Kenang · Aiman & Sofea
- QR card: "Imbas & kenang hari bahagia kami"

**Other candidates**

| Name | Meaning | Fit |
| --- | --- | --- |
| Imbas | To scan; imbas kembali = flashback | Double meaning: scan the QR, later look back on the day |
| Abadi | Eternal; abadikan = capture forever | The natural phrase for capturing moments |
| Senyum | Smile | What everyone says before a photo; friendly for all ages |
| Simpan | To keep | Says what the app does with memories |
| Tatap | To gaze at fondly | Soft and affectionate |
| Sorot | To spotlight, look back on | Suits the gallery and replay feel |
| Rai | To celebrate | Very short, lively |
| Jemput | To invite | Ties to the invitation card where the QR is printed |
| Seri | Radiance, as in seri pengantin | Elegant, but very common in Malaysian business names |
| Pusaka | Heirloom | Memories kept and passed down |
| Warisan | Heritage, legacy | Similar to Pusaka, more formal |
| Lensa Hikayat | Lens + classical tale | The day's story through guests' lenses |
| Cindai Kirana | Patterned silk + ray of light | Heritage and grace; most decorative |
| Warkah | Old word for a letter | Dropped: harder for guests to read and say |
| Detik | A moment | Avoid: detik.com is a large Indonesian news portal |

**Blessing and Arabic-rooted candidates**

These carry a warm, doa-like feel familiar at Malay weddings. Common religious words are harder to trademark and may feel narrower for non-Muslim events.

| Name | Meaning | Fit |
| --- | --- | --- |
| Barakah | Divine blessing, abundance | Warm and widely understood; common word, harder to trademark |
| Berkat | Blessing (Malay form of barakah) | Very familiar to every guest; also the name of the kenduri take-home gift, a nice double meaning |
| Blessing | English for berkat | Clear internationally, but generic |
| Barakallah | "May Allah bless", from the wedding doa barakallahu lakuma | Instantly recognised congratulation; long for a domain |
| Mabruk | Congratulations | Short, joyful, easy to say |
| Sakinah | Tranquillity, from sakinah mawaddah warahmah | Gentle and elegant; very wedding-specific |
| Mawaddah | Loving affection | Romantic; wedding-specific |
| Rahmah | Mercy, compassion | Soft and kind |
| Saadah | Happiness | Bright, uncommon |
| Zikrayat | Memories (Arabic) | Closest Arabic match to the app's purpose; less familiar to some guests |
| Walimah | The wedding feast | Clear but wedding-only |

## Guest flow and screens

Guests reach the menu in three screens, and the gallery stays locked until they have uploaded one thing, so they meet the private/public choice before seeing anyone else's photos.

1. **Scan QR** printed on table cards or signage. The link carries the event code (e.g. `yourapp.com/e/aiman-sofea`).
2. **Nama:** guest types their name. Saved on the phone, never asked again.
3. **Selfie:** becomes their profile picture, shown only next to their public items. A Langkau (Skip) button is always visible.
4. **Menu (choose page):** seven big buttons. Galeri is greyed out with a lock.
5. **First capture:** any item counts (photo, upload, wish, call), including a private one. The selfie does not count.
6. **Privacy step (first time only):** full-screen choice between two large cards, default Peribadi. See Privacy and gallery logic.
7. **Sent:** confirmation, then Galeri unlocks.

Tapping Galeri before the first upload shows: "Kongsi satu detik dahulu untuk buka galeri" with shortcuts to Snapshot and Tulis Ucapan. The unlock is stored on the phone and in the guest record. Hosts bypass the lock.

**Screens**

| Screen | Purpose |
| --- | --- |
| Welcome / Nama | Event title, couple names, name input, EN toggle |
| Selfie | Front camera, retake, skip |
| Menu | The seven functions, upload queue indicator |
| Capture screens | One per function (camera, call screen, text box) |
| Privacy step | Peribadi / Awam, first time big, later a small toggle |
| Upload queue | Items waiting, progress, retry |
| Galeri | Live gallery timeline + Muat Naik Saya (My Uploads) tab |
| Item view | Full view, download original or framed version |
| Lapor Masalah | Bug report form |

**Event links and access**

Guests enter only through the QR link or the event code; the plain name link alone does not open the event.

| URL | What it shows |
| --- | --- |
| `kenang.app/zaimhidayah` | "Imbas kod QR di majlis atau masukkan kod" with a code box. Correct code opens the event |
| `kenang.app/zaimhidayah-k7q2` | The QR link: opens the event directly (welcome, name, selfie, menu) |
| `kenang.app/zaimhidayah-k7q2/galeri` | Gallery, locked until first upload |
| `kenang.app/zaimhidayah-k7q2/saya` | My Uploads |
| `kenang.app/admin` | Admin for all events |

- The code (e.g. **K7Q2**) is printed on the QR card under the QR, so guests whose camera won't scan can type it.
- 4 characters, not case-sensitive, no look-alike characters (0/O, 1/I/L).
- Wrong attempts are rate-limited (5 tries, then a short wait) so the code cannot be guessed.
- After a correct code, the phone remembers the event; returning guests go straight to the menu.
- Hosts can regenerate the code from admin if it leaks; old QR cards then stop working.
- Reserved words (admin, api, login) can never be event names.

## Features

The menu has eight functions (the seven below plus Folder Kongsi). Uploads are unlimited per guest until the event's total reaches a host-set threshold, after which a per-guest quota switches on automatically.

| Menu (BM / EN) | What it does | Capture method | Length |
| --- | --- | --- | --- |
| Snap Gambar / Snapshot | Take a photo | Phone's native camera via browser file capture: full resolution + EXIF | n/a |
| Muat Naik dari Galeri / Upload from Gallery | Share photos and videos already on the phone, including normal video clips of the event | File picker, multiple files | No limit |
| Ucapan Video / Video Wish | Video message to the couple | In-app recorder | Silence rule + 15 min cap |
| Boomerang | 1 to 2 second loop | In-app recorder with 3-2-1 countdown; loop made in the background | 1 to 2 s |
| Telefon Pengantin / Call the Couple | Voice wish, phone-call style | In-app audio recorder | Silence rule + 15 min cap |
| Tulis Ucapan / Type a Wish | Text wish with an optional photo from the phone gallery | Text box + file picker | n/a |
| Galeri / Gallery | Live gallery + My Uploads | n/a | n/a |

**Call the Couple (voice wish)**

- Call screen: couple's photo, "Memanggil Aiman & Sofea...", a short beep, a timer counting up, a large red End call button.
- Guest holds the phone to the ear like a real call, so the mic sits at the mouth and the recording is clear in a loud hall. No host greeting.
- Silence rule: voice detection (not volume) listens for nearby speech. 45 s without voice: soft beep and "Masih di sana?". 60 s without voice: double beep, call ends.
- Safety cap: warning beep and "1 minit lagi" at 14:00, call ends at 15:00.
- On end, the recording is saved to the upload queue automatically; the review screen allows listen back or delete. Trailing silence is trimmed.
- Saved in 10-second chunks to the phone; screen kept awake during the call; accidental cheek taps are ignored, only the End button responds.
- Unlimited calls per guest. Browser noise suppression and echo cancellation on.

**Video Wish:** same behaviour as the call (stop button, 60 s silence auto-end, 15 min cap), so guests learn one rule.

**Upload from Gallery:** no length limit. For large files the app asks "Muat naik sekarang, atau nanti guna wifi?". Uploads stay open for 30 days after the event; the same link at home resumes as the same guest. Per-file cap 4 GB.

**Type a Wish:** a text box, an optional photo, and send. No wish categories or tags.

**Decorate (Hiasan):** frames and filters sit behind one small button. Guests who ignore it never see them.

**Folder Kongsi (shared folder):** replaces AirDrop and WhatsApp for sending many photos to the couple. Any guest creates a folder (e.g. "Kamera Pak Long") and uploads photos and videos in original quality. The app gives a 6-digit PIN and a link; one "Kongsi" button sends both.

- Only the couple, the creator and people who entered the PIN can open the folder. It never appears in the public gallery, and moderators cannot see it.
- PIN holders can view, download single photos and add their own. The creator and the couple can download everything as a ZIP, reset the PIN (optionally removing old members) or delete the folder.
- The link alone shows only a PIN screen. A folder PIN opens that folder only, not the event.
- Adding more later uploads only new files, so re-picking 300 photos never duplicates.
- The couple sees every folder in a Folders tab, and the full export keeps the folder structure.
- Protected by server-checked PINs with rate limits and lockout. Planned for v0.4.

**Choosing functions and pricing:** a function is available only if the couple's package includes it AND the couple switched it on for that event, so each event can have its own set (e.g. a quieter nikah, a full reception). Switched-off tiles disappear from the guest menu. Switching off never deletes anything already uploaded.

| Package (proposal) | Includes |
| --- | --- |
| Asas | Snap Gambar, Muat Naik dari Galeri, Tulis Ucapan, gallery, theme |
| Lengkap | Asas + Ucapan Video, Telefon Pengantin, Boomerang, name stamp |
| Premium | Lengkap + Folder Kongsi, frames and filters, clean address, several events, helper accounts, full export |
| Custom | Any combination |

Any single function can also be bought as an add-on, plus extra events, guests or storage. Prices are stored as data (not code) with a snapshot per purchase; the amounts are being worked out in the costing chat. Toggles are planned for v0.5, the pricing page and checkout after v1.0.

## Privacy and gallery logic

Every item is Peribadi (private, only the couple sees it) unless the guest actively chooses Awam (public), so no guest is ever surprised by something becoming public.

- **First upload:** full-screen choice with two large cards: Peribadi – "Hanya untuk pengantin" and Awam – "Kongsi di galeri". Default Peribadi. Line underneath: "Boleh tukar bila-bila masa di Muat Naik Saya."
- **Later uploads:** a small toggle that remembers the last choice.
- **Show my name / Anonymous:** on public items, the guest picks whether their name and selfie appear.
- **My Uploads:** always reachable; switch any item between private and public, or delete it.
- **Gallery:** one timeline sorted by capture time from metadata (fallback: upload time), with date dividers and filters All / Gambar / Video / Ucapan. No manual albums (Nikah, Resepsi). Old photos from Upload from Gallery fall into their real date position.
- **Gallery mode (host setting):** live during the event, revealed after the event, or off.
- **Moderation:** hosts can hide any public item.
- **Location** is never shown in the public gallery; only hosts see it, and only in the admin view and export.

## Metadata, decoration, bug report and copyright

**Metadata.** Originals keep their own EXIF untouched, and every item also gets a database record, so metadata survives even for voice and in-app video that have no EXIF.

| Type | Read automatically |
| --- | --- |
| Photo | EXIF capture time, camera model, width/height, GPS |
| Video (uploaded) | Creation time, duration, resolution, GPS (read by a background function, since browsers cannot read video metadata reliably) |
| Video Wish, Boomerang, Call | Time, duration, device; device location if the guest allowed it |
| Every item | Guest, event, type, source (camera / boomerang / upload), visibility, decoration used, file size, MIME type, upload time |

- iPhones often remove location and convert HEIC to JPEG when a file is picked in a browser. Whatever survives is stored, with `location.source = exif | device | none`.
- Location permission for in-app captures is asked once; declining leaves it empty.

**Decoration (non-destructive).** The original is never altered. The guest's choices (name stamp, frame, filter) are saved as a small recipe, and a background function renders the decorated copy. Frames can be changed later and everything regenerated. Downloads offer Original and Dengan bingkai (With frame). Video and boomerang get name stamp and frame only, no filters. The name stamp is on by default; hosts can turn it off.

**Lapor Masalah (bug report).** A small button in the footer of every screen opens a one-screen form: what happened (text), optional screenshot. The app attaches automatically: device and browser, app version, current screen, language, upload queue state, and recent error log. Reports land in the admin page with a status (new / seen / fixed).

**Copyright.** A footer on every screen: "© 2026 \[owner name\]. Hak cipta terpelihara." The owner text is set per event in admin, so the engagement and the wedding can each show their own line. Open question: whose name or brand goes on the default line.

## Multi-event admin (built-in CMS)

No separate CMS: everything editable lives in each event's settings record and is edited from an `/admin` page inside the same app. Moving from the engagement to the wedding means creating a new event.

**Roles**

- **Super admin (Hidayah):** create events, pick a template, assign hosts, see all bug reports.
- **Event host (e.g. the engaged couple):** manage only their own event: settings, moderation, downloads.

**Create / edit event**

- Event type template: Pertunangan, Perkahwinan, Aqiqah, Hari Jadi
- Names, date, venue, URL slug
- Theme: colours, font, cover photo, welcome text in BM and EN
- Frames (upload PNGs), filters enabled, name-stamp style and on/off
- Limits: global threshold and per-guest quota, per-file cap
- Gallery mode: live, after event, or off; reveal time
- Upload window after the event (default 30 days)
- Copyright owner line
- Status: draft, live, ended
- Generates a printable QR code

**Event dashboard**

- Counts: guests, photos, videos, wishes, storage used
- Moderation feed with hide and delete
- Bug reports
- Download everything as ZIP + metadata as CSV/JSON (including private items and locations)

If a real CMS is ever needed later, Sanity or Payload can be added without changing the guest app.

**Spaces: one couple, many events.** A space (e.g. `zaimhidayah`) holds several fully separate events (tunang, nikah, sanding, bertandang), each with its own date, theme, code, guests and gallery. Typing the couple's address opens the current event; QR links join a specific event and then hide the code from the address bar. The public view shows only the couple's names and the current event's title.

- **Two addresses per couple:** `a permanent one (/s/7k3qmx, random ID, never changes; without a valid code it shows only a neutral code screen)` used on every printed QR code and after the event, and a clean name (`kenang.app/zaimhidayah`) that works only during a booked window (default: event day 00:00 to 24 hours after the event), then becomes free for other couples. Outside the window it shows a neutral page with no couple information.
- **Same name, same dates:** overlapping bookings are blocked and flagged to the super admin to resolve manually (rare).
- **Path-based on one site**, not subdomains: guests stay recognised whether they scan or type, and it works today on the free Firebase domain.
- **Couple access:** each partner has their own account with full owner access; an optional moderator (e.g. a sibling) can only hide public items. Every host action is logged. Couples reach their dashboard via the login page.
- **Language rule:** all code and backend names are English; Malay only in the UI and host-entered titles.

**Internal space number:** each space also gets a 5-digit number for admin, invoices and support only, never shown in links or to guests: #00000 Zaim & Hidayah, #00001 demo, #00002-#09999 internal tests, #10000 reserved, real spaces from #10001 (the friend's engagement).

**Domain change:** the domain is one setting (`PUBLIC_BASE_URL`); the database stores only IDs and paths, never full links. Buying `kenang.app` later means connecting it in Firebase, adding it to Auth and App Check, changing the setting and redeploying. The old free domain keeps working (no automatic redirect), so earlier QR codes and guests' device data are unaffected.

Full design and privacy rules: `docs/architecture.md` Part 3.

## Tech stack and data model

The whole system runs on Firebase (Blaze plan), Singapore region, with a React + TypeScript PWA as the guest and admin front end.

| Layer | Choice | Notes |
| --- | --- | --- |
| Language | TypeScript | Front end and Cloud Functions |
| Front end | React + Vite, PWA (vite-plugin-pwa) | Guest app and /admin in one codebase |
| UI | Tailwind CSS | Large, simple components |
| Languages | i18next with ms.json (default) and en.json |  |
| Local queue | IndexedDB (Dexie) | Captures saved on the phone before upload |
| Guest login | Firebase Anonymous Auth + name | Hidden guest ID for security rules |
| Admin login | Firebase Auth (email or Google) + custom role claims | super admin / host |
| Database | Cloud Firestore | Real-time gallery |
| Files | Firebase Storage, resumable uploads | Region asia-southeast1 (Singapore) |
| Background jobs | Cloud Functions: sharp (images), ffmpeg (video, boomerang, voice) | Thumbnails, display copies, frames, metadata, counters |
| Voice detection | Silero VAD in the browser (@ricky0123/vad-web) | Silence rule for call and video wish |
| Metadata reading | exifr (browser), ffprobe (functions) |  |
| Abuse protection | Firebase App Check + security rules |  |
| Hosting | Firebase Hosting + custom domain |  |
| Monitoring | Firebase console, budget alerts |  |

**Data model**

```
events/{eventId}
  slug, type, status (draft|live|ended), ownerIds[], copyrightOwner
  theme: { primary, accent, font, coverUrl, frameUrls[] }
  content: { ms: {title, welcome}, en: {title, welcome} }
  settings: { globalLimit, perGuestLimit, limitActive, fileCapGB,
              galleryMode (live|after|off), revealAt, uploadWindowDays,
              stampDefault, filtersEnabled[] }
  stats/{shard}: distributed counters (uploads, guests, bytes)

  guests/{guestId}
    name, selfieMediaId, lang, device, joinedAt,
    uploadCount, galleryUnlocked

  media/{mediaId}
    guestId, type (photo|video|boomerang|voice|videoWish)
    source (camera|boomerang|upload|inapp)
    visibility (private|public), showName, hidden
    status (queued|uploading|processing|ready|failed)
    sortAt (capturedAt ?? uploadedAt)
    edits: { stamp, frameId, filter }
    files: { original, display, thumb, decorated }
    meta: { capturedAt, uploadedAt, width, height, durationSec,
            sizeBytes, mimeType, cameraModel, exif{} }
    location: { lat, lng, source (exif|device|none) }   host-only

  wishes/{wishId}
    guestId, kind (text|call), text?, photoMediaId?, voiceMediaId?,
    visibility, showName, createdAt

  bugReports/{reportId}
    guestId, message, screenshotPath?, device, appVersion,
    screen, lang, queueState, errorLog[], status, createdAt

templates/{templateId}   reusable theme presets
```

**Storage paths:** `events/{eventId}/{guestId}/original/`, `/display/`, `/thumb/`, `/decorated/`, `/bug/`

**Security rules:** guests write only their own records and files; private items readable only by hosts; public items readable by anyone holding the event code; location fields never returned to guests.

**Data model corrections (from the design review):**

- Firestore rules cannot hide individual fields, so `location` and raw EXIF move to `media/{mediaId}/private/meta`, readable only by hosts.
- Media docs store only `ownerUid` (a random ID) and never the guest name, unless `showName` is true; `guests/{uid}` is readable only by that guest and hosts.
- `mediaId` is a UUID generated on the phone at capture, used as both doc ID and storage path, so retries never create duplicates.
- Routes use a single `/:entry` parameter (e.g. `zaimhidayah-k7q2`), split on the last hyphen.

The full list of pitfalls and fixes lives in `docs/architecture.md` in the repo.

## Connectivity and 200 concurrent users

Firebase scales to 200 simultaneous users on its own; the real bottleneck is venue internet, so the app is built offline-first.

**Upload pipeline**

1. Every capture is saved on the phone (IndexedDB) the moment it is taken.
2. A queue uploads one file at a time per phone, photos and wishes before videos.
3. Uploads are resumable: large files go in chunks and continue where they stopped.
4. Guests keep using the app while uploads run; a small indicator shows "3 menunggu dihantar".
5. Optional: a small preview uploads first so the item appears in the gallery quickly; the original follows.
6. Once uploaded, background functions make thumbnail, display and decorated copies and read video metadata.

iPhone limitation: uploads pause when the browser is closed and resume when the link is reopened. The app shows "Biarkan halaman ini terbuka sehingga selesai" while items are pending.

| Risk | Mitigation |
| --- | --- |
| Venue internet overloaded | Queue, resumable chunks, photos first, wifi password on the QR card, "upload later on wifi" option, 30-day upload window |
| Gallery reads from 200 phones | Load 30 items at a time, thumbnails only, full size on tap |
| Shared counters | Distributed counters or count queries, never one counter document |
| Video processing spikes | Functions queue with max instances and enough memory; guests never wait for it |
| Spam or strangers | Event code in QR, App Check, size and type limits in security rules |
| Surprise bill | Budget alerts; gallery never serves originals |

**Testing:** Firebase Emulator during development; a load-test script simulating 200 guests uploading; the friend's engagement as the live stress test, with the Firebase console open during the event.

## Performance

The app must open in under 3 seconds and never freeze on a mid-range Android in a crowded hall, measured with Chrome DevTools "Slow 4G" and 4x CPU slowdown.

| Metric | Target |
| --- | --- |
| QR scan to name screen | Under 3 s |
| Guest first-load JavaScript | Under 150 KB gzipped |
| Fonts | Under 80 KB total, self-hosted |
| Tap response | Under 200 ms |
| Reopening the app | Instant, works offline |

- **Fast first load:** admin code never loads for guests; voice detection model, boomerang recorder and decoration preview load only when needed (voice model prefetched while on the menu); modular Firebase imports; service worker caches the app shell, fonts, theme and cover photo.
- **Capture without freezing:** previews, EXIF and compression run in a Web Worker; videos stream from the file in chunks, never fully in memory; camera stream stops when leaving capture screens.
- **Phone storage:** camera captures are saved to the browser first; gallery uploads stream from the original file and ask the guest to re-pick it if interrupted; the app requests persistent storage.
- **Gallery:** virtualised list; \~400 px WebP thumbnails lazy-loaded with fixed-size colour placeholders; live updates only for the newest 30 items; video posters, 720p on tap; refresh pauses in the background.
- **Weak signal and battery:** upload queue has priority over gallery loading; smaller thumbnails on slow connections or Data Saver; screen kept awake only during calls and video wishes; immutable file names with long cache headers.
- **Measure:** a real cheap Android and an older iPhone; Lighthouse before each preview deploy; Firebase Performance Monitoring for real-guest data at the engagement test.

## Cost estimate for 1,000 guests

The medium scenario costs about US$60–70 (roughly RM 270–320) in total, and bandwidth for downloads is the biggest item, not storage.

**Assumption:** 600 of 1,000 guests take part, each producing about 430 MB (15 photos 60 MB, 2 video wishes 200 MB, 3 boomerangs 15 MB, 2 calls 4 MB, gallery uploads 150 MB). That is about 260 GB of originals, about 300 GB with derived copies.

| Item | Basis | Approx. USD |
| --- | --- | --- |
| Storage | 300 GB × \~$0.02/GB/month × 3 months | 18 |
| Uploads | Free | 0 |
| Downloads | \~410 GB (gallery browsing 60, guest downloads 50, host download-all 300) minus 100 GB free, × \~$0.12/GB | 37 |
| Firestore | \~70k writes, \~1.5M reads | 1 |
| Cloud Functions | \~2,000 video and boomerang jobs | 5–15 |
| Hosting | Small app files | 0 |
| **Total (medium, \~300 GB)** |  | **60–70** |

| Scenario | Data | Approx. total |
| --- | --- | --- |
| Light (mostly photos) | \~100 GB | US$15–25 (RM 70–110) |
| Medium | \~300 GB | US$60–70 (RM 270–320) |
| Heavy (many long uploaded videos) | \~800 GB | US$150–180 (RM 650–800) |

Free allowances used: Firebase Storage includes 5 GB-months of storage and 100 GB/month of downloads on Blaze (these apply to US regions; Singapore is chosen anyway for faster uploads from Malaysia). Firestore gives 50,000 reads and 20,000 writes per day free; beyond that, reads cost $0.03 and writes $0.09 per 100,000. Per-GB storage and bandwidth rates are approximate and vary by region; recheck with the Blaze calculator at setup. Ringgit figures assume about RM 4.4–4.5 per US$.

**Keeping it low:** gallery serves compressed copies only; download everything once after the event, then move originals to Coldline/Archive or delete; budget alerts at RM 100, 200 and 400; 4 GB per-file cap.

**Business path: move files to Cloudflare R2.** Downloads are the largest cost on Firebase (about $0.12/GB). R2 stores files at about $0.015/GB-month with free downloads, cutting the medium-event cloud cost from roughly US$60–70 to US$20–30. Plan: Firebase only for the engagement and the wedding; for a business, keep Firebase for auth, database and functions and move media to R2. All file handling goes through one storage adapter from day one, so the switch touches no screens. Detailed costing and pricing continue in a separate chat. [R2 pricing (Semaphore)](https://semaphore.io/blog/cloudflare-r2%22)

Sources: [Firebase pricing](https://firebase.google.com/pricing), [Firestore pricing](https://cloud.google.com/firestore/pricing), [Firestore Standard edition](https://firebase.google.com/docs/firestore/enterprise/pricing)

## Market study

Most features already exist across commercial apps, but none combines them with BM/EN, per-item privacy, original-quality metadata and an offline upload queue.

| App | Model | Notable features |
| --- | --- | --- |
| [POV](https://www.apkmirror.com/apk/untitled-tech-inc/pov-disposable-camera-events/pov-disposable-camera-events-1-49-2-release/) | Disposable camera, no guest install | Shot cap per guest; reveal during, after or delayed; shared or host-only gallery; custom screens. Audio guestbook works by calling a phone number. 2023 pricing US$4.99 (25 guests) to US$89.99 (250), custom above ([The Edge](https://theedgemalaysia.com/node/691150)) |
| [Once](https://apps.apple.com/app/id6754265953) | Disposable camera | Limited shots, photos unlock together at a chosen time, private by default |
| [The Disposable (Scene)](https://apps.apple.com/app/id6758879648) | Disposable camera | Host sets shot limit, reveal time, camera style |
| [Lense](https://apps.apple.com/app/id6444442256) | Disposable camera | Vintage effect, video; one review says too many steps put guests off |
| [GuestPix](https://www.lep.co.uk/recommended/guestpix-wedding-5061104) | Upload gallery + guestbook | Name only to upload; text or video guestbook |
| [Wedibox](https://app.wedibox.com/help/set-up-audio-guestbook) | All-in-one hub | Browser voicemail with host greeting, ZIP download |
| [Wedding Arrivals](https://www.capterra.co.uk/software/1107515/Wedding-Arrivals) | Upload gallery | Sub-albums per part of the day, audio guestbook |
| [voxu.fm](https://www.producthunt.com/posts/voxu-fm) | Audio guestbook | Voice messages paired with selfies |
| [InvitePix](https://www.getapp.com/all-software/a/invitepix/) | Upload gallery | Full-resolution uploads, flat pricing |

**Lessons applied:** friction kills participation (hence three screens to the menu); selfie pairs well with wishes; no host greeting and no sub-albums, by choice, for simplicity.

## Build phases

Seven phases (0 to 6), with the friend's engagement as the gate before the wedding. Dates to be set once the engagement date is known.

- [ ] **Phase 0 – Setup:** Firebase project (Blaze, Singapore), GitHub repo, React + Vite + TypeScript skeleton, i18n BM/EN, emulators, CLAUDE.md
- [ ] **Phase 1 – MVP:** event by slug, name + selfie, menu, Snapshot, Upload from Gallery, local queue + resumable upload, privacy step, My Uploads
- [ ] **Phase 2 – Wishes:** Type a Wish (+ photo), Call the Couple, Video Wish, voice detection and 15-minute cap
- [ ] **Phase 3 – Gallery and processing:** gallery lock, live timeline, thumbnails and display copies, metadata extraction, boomerang, name stamp, frames, filters, shared folders
- [ ] **Phase 4 – Admin:** roles, create event, theme, limits, moderation, bug reports, export ZIP + CSV, QR generator, copyright footer
- [ ] **Phase 5 – Hardening:** security rules, App Check, budget alerts, load test for 200 users, test on old Android and iPhone Safari
- [ ] **Gate – Friend's engagement:** run live, monitor, collect bug reports
- [ ] **Phase 6 – Polish for the wedding:** fix issues, new event and theme, print QR cards

## Claude Code setup and what to learn

Prepare accounts and tools first, put this spec and a CLAUDE.md in the repo, then build one phase at a time with Claude Code.

**Accounts and tools to set up**

- [ ] GitHub account and a private repo (e.g. `wedding-cam`)
- [ ] Google / Firebase account; project on the Blaze plan, region asia-southeast1, budget alerts set
- [ ] Node.js LTS, Git, VS Code
- [ ] Firebase CLI (`firebase login`, emulators)
- [ ] Claude Code installed and signed in (setup steps at [docs.claude.com](https://docs.claude.com))
- [ ] Test devices: one iPhone (Safari) and one older Android (Chrome)
- [ ] Optional: a domain name for nicer QR links

**Repo structure to create**

```
wedding-cam/
  CLAUDE.md            project rules for Claude Code
  docs/spec.md         this document, exported as Markdown
  web/                 React + Vite + TypeScript PWA (guest + /admin)
    src/i18n/ms.json   default language
    src/i18n/en.json
  functions/           Cloud Functions in TypeScript (sharp, ffmpeg)
  firestore.rules
  storage.rules
  firebase.json
  .env.example
```

**What to put in CLAUDE.md**

- One-paragraph summary of the app and link to docs/spec.md
- Stack and versions; region asia-southeast1
- Rules: TypeScript strict; BM default with every string in ms.json and en.json; simplicity rules (big buttons, icon + word, two taps, no gestures); originals never modified; location never sent to guests
- Commands: dev server, emulators, tests, deploy
- Working style: plan first, one feature per session, run in emulators before deploy

**What to learn, in order**

1. Git and GitHub basics: commit, branch, push, revert
2. TypeScript basics: types, interfaces, async/await
3. React fundamentals: components, props, state, hooks, routing
4. Firebase: Anonymous Auth, Firestore data modelling and queries, Storage resumable uploads, Security Rules, Emulator Suite, Cloud Functions
5. Browser media: file input with capture, getUserMedia, MediaRecorder, Web Audio (for voice detection), Wake Lock
6. Offline: IndexedDB and PWA service workers
7. Media processing basics: ffmpeg commands, EXIF and metadata
8. Working with Claude Code: give it the spec, ask for a plan before code, review every diff, commit often, keep tasks small

**Tips for the build loop**

- Phone cameras require HTTPS, so test on real phones through Firebase Hosting preview channels rather than a local IP address.
- Build Phase 1 end to end before adding wishes: a working upload queue is the foundation for everything else.


> Where the spec and these files disagree, the newer files win: `AGENTS.md`, `docs/architecture/architecture.md` (Part 3: spaces and addresses) and `docs/ai/memory.md` (decision log). In particular, the spec's early URL examples and its "Claude Code setup" section are superseded.