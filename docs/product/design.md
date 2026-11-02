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
- Status uses words and icons, not extra colours: "Dah hantar" with a check, "Sedang dihantar" with a progress circle in accent (D-090).
- Every text pair passes 4.5:1 (3:1 only for large text); `web/tests/contrast.test.ts` checks the tokens automatically.
- Light theme only for v1. Weddings are bright, guests are mid-event, and one theme is easier to get right.

## Typography

Standard app sizes, clean and minimal like Google Photos (D-092, supersedes the 18 px minimum). Sizes are in rem (16 px root) so the phone's own text-size setting applies; "Aa" Besar scales the root to 125%.

| Role | Font | Size (mobile, at Biasa) |
| --- | --- | --- |
| Couple names, event title | Instrument Serif (or the card's own display font, per event) | 32px (`2rem`) |
| Screen titles | Instrument Serif | 24px (`1.5rem`) |
| Body | Atkinson Hyperlegible | 16px (`1rem`) |
| Buttons | Atkinson Hyperlegible, bold | 16px (`1rem`) |
| Secondary text, labels, captions, timestamps, date headings | Atkinson Hyperlegible | 13-14px (`0.8125-0.875rem`) |

- Atkinson Hyperlegible was designed for low vision: right for makcik and pakcik at standard sizes.
- **Text size "Aa" (D-092):** a small button in the top row (next to EN), so it is one tap away on the name screen, the menu and every other screen. Biasa (100%) / Besar (125% root font size); saved on the device (localStorage, read and written inside try/catch; Biasa if storage is blocked).
- Never block pinch-zoom: the viewport meta has no `maximum-scale` and no `user-scalable=no`.
- Only the couple's names and screen titles use the serif. Everything a guest must read or tap uses Atkinson.
- Sentence case everywhere. No ALL CAPS buttons.
- Self-host both fonts (no external font requests at the venue).

## Layout and shape

- Single column, 16px side margins, tight vertical rhythm (4px grid: 4, 8, 12, 16, 24, 32).
- Buttons: full width, 48px tall, corners 8px. Not pills. Every tap target at least 44-48px.
- Menu: a 2-column grid of tiles (up to seven), each icon + one word. Galeri as a full-width tile at the bottom. Tiles for functions the host switched off disappear and the grid reflows (an odd last tile spans the full width).
- Borders: 1px `--line` hairlines. No drop shadows. Elevation is shown by `--paper-2`, not shadow.
- One quiet decorative element allowed: a thin double rule in `--line` under the couple's names, echoing an invitation card. Nothing else ornamental on working screens.
- Photos get a slim paper-coloured border like a printed photo, except in the Muat Naik Saya grid (edge to edge, D-093).
- Small text links are allowed only in the top row and above a screen title: "Kembali" on code, error and help screens, "Buka dalam Chrome/Safari" after a guest chose to stay in an in-app browser (D-086), and "Muat Naik Saya (n) →" under the buttons on the Snap Gambar screen (D-089). Caption size (13-14 px), at least 44 px tall to tap.

## Icons

- One outline icon set, 2px stroke, 24px in tiles and buttons (e.g. Phosphor or Lucide, restyled consistently).
- Main actions have a word next to the icon. No icon-only buttons except the camera flip.
- The small marks on Muat Naik Saya tiles are status, not buttons (below).

## Muat Naik Saya (D-093, replaces the D-085 icon-only exception)

Like a phone's photo gallery: clean, the photos carry the page.

- **Top:** only "← Kembali" and the title. The top row's "Aa" and language buttons are hidden on this page (the in-app browser link stays).
- **Upload line:** one slim line with no box, 13 px, only while something is waiting, sending or held for wifi. It shows a small ring, "Sedang dihantar n%", "n menunggu", and "n menunggu wifi · Hantar sekarang".
- **Grid:** square tiles, 3 columns, 2 px gaps, edge to edge, `object-fit: cover`; no frames, cards, borders or text on tiles. The tile is one button that opens the item.
- **Marks, only when something needs attention:**
  - Clock: waiting, or held for wifi.
  - Percentage ring: only the one item sending.
  - "!": failed, refused, not arrived, or needs re-picking.
  - Sent items carry no mark. A small globe marks Awam items only (Peribadi is the default and carries no lock).
  - Videos show a small play mark and their length.
  - No dimming and no spinner per tile.
- **Day headings,** 14 px bold: "Hari ini", "Semalam", then "2 Nov 2026", by when the item was taken (EXIF, the camera, or else the upload), on the phone's calendar.
- **Speed:** a tile reads its preview only once it nears the screen, and off-screen days skip layout and paint (`content-visibility`).
- **Item view (tap a tile), full screen like a phone's gallery viewer (D-094):**
  - The one dark screen in the app: `--ink` (warm near-black, never pure black) behind the photo, with paper-coloured text.
  - The photo or video at its own shape and full quality: this phone's copy, or the guest's own original from the server (an explicit tap, D-091). It is fitted to the space between the top bar and the controls, never cropped. The small preview shows only until the full file arrives. Pinch-zoom works as on any page.
  - Top: "← Kembali" and the date and time (13 px, `--line` on ink).
  - Below: one status line, Peribadi / Awam as a two-part control (the chosen part filled in paper), "Tunjuk nama saya" as a switch (only when Awam), and "Cuba lagi" (failed) or "Hantar sekarang" (held) as the one accent button next to Padam (outlined in `--line`). All 48 px with words.
  - Text pairs on ink are in the automated contrast test.
- **Padam** asks on its own screen in the app (small preview, the warning, filled danger "Padam", "Batal"), never in a browser dialog.
- Taps only: no swiping between items, no long-press to select.
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
- Oversized "senior mode" UI: 64px buttons, 18px+ body text, huge tiles (D-092: standard sizes, with "Aa" Besar for larger text)
- Font sizes in px, or a viewport that blocks pinch-zoom (`maximum-scale`, `user-scalable=no`)

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
