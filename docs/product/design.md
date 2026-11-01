# Design direction

**One idea:** a quiet, paper-like base with ONE accent colour taken from the couple's own invitation card. The app should feel like the kad jemputan came alive, not like a tech product. Everything neutral stays neutral so the couple's colour, names and cover photo carry the event.

Test event accent: **deep olive `#4B5320`**.

## Colour

Only one colour changes per event: the accent. Everything else is fixed.

| Token | Value | Use |
| --- | --- | --- |
| `--paper` | `#F5EFE3` | Page background (warm off-white, never pure white) |
| `--paper-2` | `#EBE3D2` | Raised surfaces: input fields, cards, the upload queue bar |
| `--ink` | `#2B2420` | Main text (warm near-black, never pure black) |
| `--ink-2` | `#5E554C` | Secondary text, captions, timestamps |
| `--line` | `#D8CDB8` | Hairline borders and dividers |
| `--accent` | per event, test `#4B5320` | Primary buttons, selected states, links, the couple's names |
| `--accent-press` | accent darkened ~15% (auto) | Pressed state |
| `--accent-tint` | accent at ~10% over paper (auto) | Selected card background, privacy choice highlight |
| `--on-accent` | `#FFFDF8` | Text and icons on accent buttons |
| `--danger` | `#9E2A2B` (fixed, not themed) | End call, delete only |

Measured contrast with the test accent: ink on paper 13.3:1, olive on paper 7.2:1, white on olive 8.1:1, ink-2 on paper 6.4:1. All pass WCAG AA; most pass AAA.

**Rules**
- One accent per screen. If two things compete for the accent, one of them is wrong.
- The accent is for the ONE main action on a screen (e.g. the shutter, "Hantar"). Other buttons are outlined in ink.
- Admin accent picker: derive `--accent-press` and `--accent-tint` automatically, and refuse any accent below 4.5:1 against `--paper` or with `--on-accent` (show "Warna terlalu cerah, pilih yang lebih gelap").
- Status uses words and icons, not extra colours: "Dah hantar" with a check, "Sedang dihantar" with a progress bar in accent.
- Light theme only for v1. Weddings are bright, guests are mid-event, and one theme is easier to get right.

## Typography

| Role | Font | Size (mobile) |
| --- | --- | --- |
| Couple names, event title | Instrument Serif (or the card's own display font, per event) | 36-44px |
| Screen titles | Instrument Serif | 28px |
| Body, labels | Atkinson Hyperlegible | 18px minimum |
| Buttons | Atkinson Hyperlegible, bold | 20-22px |
| Captions, timestamps | Atkinson Hyperlegible | 15px minimum |

- Atkinson Hyperlegible was designed for low vision: right for makcik and pakcik.
- Only the couple's names and screen titles use the serif. Everything a guest must read or tap uses Atkinson.
- Sentence case everywhere. No ALL CAPS buttons.
- Self-host both fonts (no external font requests at the venue).

## Layout and shape

- Single column, 20px side margins, generous vertical space (8px grid: 8, 16, 24, 32, 48).
- Buttons: full width, minimum 64px tall, corners 8px. Not pills.
- Menu: a 2-column grid of large tiles (up to seven), each icon + one word. Galeri as a full-width tile at the bottom. Tiles for functions the host switched off disappear and the grid reflows (an odd last tile spans the full width).
- Borders: 1px `--line` hairlines. No drop shadows. Elevation is shown by `--paper-2`, not shadow.
- One quiet decorative element allowed: a thin double rule in `--line` under the couple's names, echoing an invitation card. Nothing else ornamental on working screens.
- Photos get a slim paper-coloured border like a printed photo.
- Small text links are allowed only in the top row and above a screen title: "Kembali" on code, error and help screens, "Buka dalam Chrome/Safari" after a guest chose to stay in an in-app browser (D-086), and "Muat Naik Saya (n) →" under the buttons on the Snap Gambar screen (D-089). Caption size, at least 44 px tall to tap.

## Icons

- One outline icon set, 2px stroke, 28-32px in tiles (e.g. Phosphor or Lucide, restyled consistently).
- Every icon has a word next to it. No icon-only buttons except the camera flip and the My Uploads item icons.
- **Exception, My Uploads (D-085):** under each preview, icon-only 48 px buttons (lock/globe = Peribadi/Awam, person = show name, bin = delete) and a corner status mark. A one-line legend with words sits above the grid, and every icon has an aria-label. Delete still asks on its own screen.
- Custom-draw the five that define the app: shutter, phone (Telefon Pengantin), letter (Tulis Ucapan), boomerang loop, folder with lock (Folder Kongsi).

## Motion, sound, touch

Motion explains, it does not decorate.

- Shutter: quick white flash + shutter click sound + short vibration (Android).
- Call: soft ringing for 1 second before recording, beeps as specified in the spec.
- Gallery unlock: one gentle "card opening" reveal, once.
- Transitions: simple 150-200ms fades or slides. Respect `prefers-reduced-motion`.

## Words

- Write BM first, natural and short, then translate to English.
- Talk like a friend at the kenduri, not a form: "Snap!", "Dah hantar", "Galeri dah dibuka!", "Cuba lagi".
- Never more than one short sentence of instruction per screen.

## Banned (looks AI-generated or templated)

- Gradients of any kind, especially purple, indigo, blue-to-pink
- Glassmorphism, blur panels, glowing borders
- Soft large drop shadows, everything `rounded-2xl` or pill-shaped
- Emoji as icons or decoration in the UI (fine inside guests' own wishes)
- Sparkles, confetti bursts, bouncing animations
- Inter / system font as the only typeface
- Generic copy: "Capture every moment", "Seamlessly", "Unlock memories"
- Stock illustrations of people
- More than one accent colour on a screen

## Per-event theme (from admin)

| Setting | Notes |
| --- | --- |
| Accent colour | One hex, from the invitation card, contrast-checked |
| Display font | Optional; default Instrument Serif |
| Cover photo | Shown on welcome screen and gallery header |
| Monogram / initials | Optional small mark from the card, SVG |
| Frames | PNGs designed alongside the card |

Design the invitation card and the app's welcome screen together, so a guest holding the card and opening the app sees the same colour, names and monogram.

## Screens to design first

1. Welcome (couple names, cover, name input)
2. Menu (seven tiles + Galeri)
3. Telefon Pengantin call screen

Get these three right on a real phone, test with an older relative, then build the rest from the same parts.
