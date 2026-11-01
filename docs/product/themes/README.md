# Theme directions (kad jemputan)

Mockups of five visual directions for the guest screens, made in Phase 1d. Each one is shown on the same three screens: the welcome after the code is checked, the menu and Muat Naik Saya. Names, date and photos are examples.

Kept as the starting point for a later "template themes" page, where a couple picks a look for their event.

| Direction | Layout | Colours | Status |
| --- | --- | --- | --- |
| A. Kad Klasik | Double frame, monogram in a double ring, centred | design.md paper + olive | Kept for later |
| B. Moden Tenang | Left-aligned, square monogram stamp, deep-bottom prints | design.md paper + olive | Kept for later |
| C. Gerbang | Cover photo in an arch, monogram on its sill | design.md paper + olive | Kept for later |
| D. Gerbang Blush | C's arch layout, flat accent arch with thin line work | Blush shawl palette | **Chosen first** (2026-11-01) |
| E. Kad Sage | Grey-sage frame, cream panel with notched corners, vertical date strip | Sage + lotus rose palette | Kept for later |

D and E change the paper from design.md. Their contrast checks (WCAG 2) are tables inside the page, computed from the same colours the screens use.

## Files

- `directions.html`: the whole board, self-contained apart from Google Fonts. Open it in a browser.
- `shoot.mjs`: saves every phone screen as a PNG (390 px wide, 2x) with headless Chrome. Run from the repo root inside the conda env: `node docs/product/themes/shoot.mjs docs/product/themes/directions.html <outDir>`. The Chrome path in the script is the Windows default. The PNGs are not committed (about 7 MB).
