# AI work log

Every AI session (Claude Code, another assistant, or a local model) adds ONE entry at the TOP of this log before its final commit. Humans review the project through this file, so write for someone who has not seen the diff.

Rules:
- Newest entry first. Never edit or delete old entries; add a correction entry instead.
- Times in Asia/Kuala_Lumpur (UTC+08:00).
- No secrets, keys, event codes or guest personal data.
- Link decisions to `docs/ai/memory.md` (D-numbers) and ADRs where relevant.

---

## Entry template

```markdown
## YYYY-MM-DD HH:MM — <short title>

- **Agent / model:** e.g. Claude Code (Claude Opus 5.5)
- **Version / branch:** vA.B (unreleased) / feat/...
- **Phase:** e.g. Phase 1
- **Goal:** what the human asked for, in one or two sentences

### What changed and why
- ...

### Files touched
| File | Change |
| --- | --- |
| path | added / modified / deleted: what |

### Commands run and results
| Command | Result |
| --- | --- |
| `npm test` | 42 passed, 0 failed |

### Decisions
- D-0xx: ... (also recorded in memory.md)

### Problems, risks, open questions
- ...

### Next steps
- [ ] ...

### Commits
- `abc1234` feat(queue): ...
```

---

## 2026-11-01 23:22 — Phase 1e: Snap Gambar asks Gambar or Video

- **Agent / model:** Claude Code (Claude Opus 5.5), VS Code extension, Windows
- **Version / branch:** v0.1 (+ unreleased) / `feat/phase-1e-video` (from `main` after PR #9 was squash-merged)
- **Phase:** Phase 1 (target v0.2), 1e
- **Goal:** fix the phone test bug "Snap Gambar can only take photos" on iPhone and Android. Confirm the storage rule for videos with tests. Deploy the backend (approved by Hidayah) and the preview channel. Record the approved theme template plan.

### What changed and why
- **Snap Gambar screen (D-088):** the tile now opens a screen with two big buttons: "Gambar" (primary, camera icon) and "Video" (outlined, video icon).
  - Each button opens its own hidden input: `accept="image/*"` or `accept="video/*"`, both with `capture="environment"`. A single input with both types opened photo mode only on Android and varied on iOS.
  - It is still two taps from the menu to the camera. The inputs are clicked inside the tap (pitfall C1).
  - The screen stays open after a capture, so the next one is one tap away. "Disimpan di telefon" and "Kamera tidak terbuka?" show there. "Kamera tidak terbuka?" → "Cuba lagi" reopens the same mode. "Kembali" returns to the menu.
  - The privacy and wifi questions work as before. Videos use the same queue: saved to IndexedDB first, priority after photos, held over 50 MB.
- **Storage rule:** unchanged; it already allowed `(image|video)/.+` up to 4 GB with the size and type matching the queued doc. New tests:
  - a camera MP4 (Android) and a QuickTime video (iPhone) upload, and a type mismatch is refused;
  - Firestore accepts a snapshot video of exactly 4 GiB and refuses one byte more.

  The emulator cannot take a 4 GB file, so the cap is tested through the doc that the file must match.
- **Unit tests:** a camera video is kept on the phone with priority after photos; an iPhone `.MOV` with no MIME type is recognised; non-media is refused.
- **Theme templates:** Hidayah approved the plan with changes. It is recorded as D-087, "approved, not built yet", to be built on `feat/theme-templates` after 1e is merged. The open question is marked resolved.
- **Docs:** CHANGELOG "Known issues" becomes "Fixed". spec.md Snap Gambar row. memory.md status, D-084 note, D-087, D-088.

### Files touched
| File | Change |
| --- | --- |
| `web/src/features/capture/SnapScreen.tsx` | added: the Gambar / Video screen |
| `web/src/features/menu/MenuPage.tsx` | modified: two camera inputs, Snap screen state, cancel and retry per mode |
| `web/src/i18n/ms.json`, `en.json` | modified: `capture.snapHint`, `capture.snapPhoto`, `capture.snapVideo` |
| `web/tests/capture.test.ts` | added: camera capture description tests |
| `rules-tests/tests/storage-media.test.ts`, `firestore-media.test.ts` | modified: camera video uploads and the 4 GB cap |
| `CHANGELOG.md`, `docs/product/spec.md`, `docs/ai/memory.md`, `docs/ai/worklog.md` | modified |

### Commands run and results
| Command | Result |
| --- | --- |
| `npm run typecheck` | clean |
| `npm test` | shared 46, web 43 (+3), emulators 86 (+3) passed |
| `npm run build` | built |
| `npm run deploy:backend` (approved by Hidayah) | complete. Firestore and Storage rules released ("already up to date", so the 1d rule was already live); indexes deployed; functions unchanged, skipped |
| `npm run deploy:preview` | `https://guestcam-2026--preview-s6g4gj5a.web.app`, expires 2026-11-08. The served event chunk has the two inputs |

### Decisions
- D-088 (Snap Gambar two buttons). D-087 recorded as approved, not built.

### Problems, risks, open questions
- A first `test:emulators` run failed: a new storage test reused a media id whose file an earlier test had left (emulator clean-up lag). Fixed with the test's own ids. The failed run left the Firestore emulator on port 8080. `npm test` (which frees the ports) then ran clean.
- Not yet checked on real phones. Hidayah's checklist: iPhone Safari and Android Chrome, photo and short video, both reach "Dihantar".
- Some Android camera apps may save videos with an unusual type. The `.mp4`/`.3gp` fallbacks cover an empty MIME type.

### Next steps
- [ ] Hidayah: phone check on the preview, then review and merge the 1e PR.
- [ ] Theme templates (D-087) on `feat/theme-templates`.
- [ ] Then "Jemput Kawan" (D-076); v0.2 only when asked.

### Commits
- `d88c542` fix(capture): Snap Gambar asks Gambar or Video, one camera input each
- `b40d939` test(rules): camera videos (MP4, QuickTime) upload up to the 4 GB cap
- docs commit with this entry

---

## 2026-11-01 22:47 — Phase 1d: theme directions D and E, mockups saved, PR opened

- **Agent / model:** Claude Code (Claude Opus 5.5), VS Code extension, Windows
- **Version / branch:** v0.1 (+ unreleased) / `feat/phase-1d-polish`
- **Phase:** Phase 1 (target v0.2), 1d polish
- **Goal:** Hidayah's requests: add theme directions D (Blush shawl colours on C's arch layout) and E (sage and lotus-rose framed card) to the comparison page, with contrast checks; keep all mockups for a later template themes page; then open the 1d PR without the theme and without a video fix.

### What changed and why
- **Theme direction D "Gerbang Blush":** C's layout and spacing with only the shawl colours. The arch is a flat accent fill with thin mauve lines (no images). The couple's names and monogram are in #86665A. Mauve draws rules and outlines. One small periwinkle check sits in the welcome divider. Contrast check (WCAG 2) of every text pair, two fixes:
  - Muted text fell to 4.19:1 on the darkest spot of C's paper texture. D uses lighter fibres (5.06:1).
  - #86665A is 4.34:1, so it is only for large serif. C's 22 px arch initials became 26 px.
- **Theme direction E "Kad Sage":** a grey-sage frame around a butter-cream panel with notched corners (CSS `clip-path`, 1 px hairline edge). Names are stacked in deep lotus rose, with a decorative vertical date strip (labelled for screen readers). A lotus bud in thin rose lines sits in the corner. Sage olive is the accent, and there is no texture. Every text pair in use passes. Muted text on the frame is 3.41:1, so no text sits on the frame.
- **Mockups saved:** `docs/product/themes/` holds `directions.html` (the whole board, with the contrast tables computed from the same colours), `shoot.mjs` (PNG screenshots) and a README. The PNGs (about 7 MB) are not committed.
- **Theme choice:** Hidayah chose D first. The proposal for recording it is in memory.md "Open questions": a `template` key in `Theme`, plus D-087, an ADR and a design.md update. It waits for approval, and nothing is built.
- **Docs for the PR:**
  - CHANGELOG has a "Known issues" entry: Snap Gambar video capture does not work on phones yet (Hidayah's phone test), fix in 1e.
  - memory.md: status updated, and a D-084 note added.

### Files touched
| File | Change |
| --- | --- |
| `docs/product/themes/directions.html`, `shoot.mjs`, `README.md` | added: theme directions A–E, screenshot script, overview |
| `CHANGELOG.md` | modified: Known issues (video capture on phones) |
| `docs/ai/memory.md` | modified: status, D-084 note, open question on theme templates |
| `docs/ai/worklog.md` | modified: this entry |

### Commands run and results
| Command | Result |
| --- | --- |
| Contrast checks (node, WCAG 2 relative luminance) | D: all text pairs pass after 2 fixes. E: all pairs in use pass. The frame pair fails and is never used |
| `docs/product/themes/shoot.mjs` | 15 screens rendered from the saved page |
| `npm run typecheck` | clean |
| `npm run build` | web and functions built |
| `npm test` | shared 46, web 40, emulators (rules + callables) 83 passed |

### Decisions
- None recorded as decided this session. The theme template proposal waits for Hidayah's approval (memory.md Open questions).

### Problems, risks, open questions
- **Snap Gambar video capture does not work on phones** (Hidayah's phone test). Not investigated or fixed in this PR, by Hidayah's instruction. Phase 1e.
- After merge Hidayah runs `npm run deploy:backend`. The Firestore media rule lets a `snapshot` be a video (the storage rule already allowed videos).
- The emulator smoke tests and a live preview check of the 1d screens were not run this session. Coverage is the automated tests plus Hidayah's phone test.

### Next steps
- [ ] Hidayah reviews and merges the 1d PR, then runs `npm run deploy:backend`.
- [ ] 1e: fix Snap Gambar video capture on phones.
- [ ] Theme: after approval of the proposal, build D as the `gerbangBlush` template.
- [ ] Then "Jemput Kawan" (D-076); v0.2 only when asked.

### Commits
- `847d655` docs(design): keep the five theme direction mockups for a later template page
- docs commit with this entry

---

## 2026-11-01 04:10 — Phase 1d polish: in-app link, back links, Snap Gambar video, My Uploads grid; theme directions

- **Agent / model:** Claude Code (Claude Opus 5.5), VS Code extension, Windows
- **Version / branch:** v0.1 (+ unreleased) / `feat/phase-1d-polish` (from `main` after PR #8 was merged)
- **Phase:** Phase 1 (target v0.2), polish from Hidayah's phone test, before "Jemput Kawan"
- **Goal:** Hidayah's four requests:
  1. A very small "Buka dalam Chrome/Safari" link after "Teruskan di sini", and a very small back arrow on code, error and help screens.
  2. Snap Gambar opens the native camera in photo or video mode.
  3. My Uploads as a compact preview grid with small icons.
  4. Two or three theme directions shown as phone screenshots, then wait for a choice.

### What changed and why
- **In-app link (D-086):** after "Teruskan di sini", the top row (left of the language switch) shows a small link.
  - Android: "Buka dalam Chrome" opens Chrome directly.
  - iPhone: "Buka dalam Safari" shows the Safari steps and "Salin pautan" again, with "Kembali".
  - The link is the address as first opened, so it still has the event code even after joining removed it from the address bar. It is kept in memory only.
  - The page underneath stays mounted while the notice is open, so a capture or question in progress is kept.
  - Built with a small top-bar slot (`components/TopBar.tsx`) that `RootLayout` provides.
- **Back links (D-086):** `Screen` has a `back` prop that renders a small "Kembali" (arrow + word, caption size, 44 px tall).
  - Used on the code screen, the offline screen, the alias-inactive page, the not-found page, the camera help and the in-app notice when reopened.
  - Without a handler it goes to the previous page, and it is hidden when there is none (a QR scan opens a fresh tab).
  - I kept the word next to the arrow because design.md asks for icon + word everywhere except the My Uploads exception.
- **Snap Gambar video (D-084, plan approved by Hidayah):**
  - The camera picker accepts `image/*,video/*`. A camera video is saved to IndexedDB first like a photo, unchanged and with no length limit (4 GB cap), and goes after photos.
  - A video over 50 MB is saved as `held` and gets the "now or later on wifi" question, after the first privacy question when there is one. "Now" releases only that video (`release(eventId, mediaIds)`). Closing the page at the question leaves it held, and the queue bar offers "Hantar sekarang".
  - Rules: a `snapshot` media doc may be `image` or `video`. `shared` `SOURCE_MEDIA_TYPES` matches. The functions already treat camera and gallery videos alike.
  - This narrows S-03 and D-009 in memory.md.
- **My Uploads grid (D-085):**
  - Two columns of previews on phones (three from 480 px) with a printed-photo border.
  - Per item, 48 px icon buttons: lock/globe, person (Awam only), bin (same confirmation screen). A corner status mark: dot with a check = sent, ring = sending, empty ring = waiting, "!" = needs the guest.
  - A one-line legend sits on top, and every icon has an aria-label. "Cuba lagi" and "Hantar sekarang" moved above the grid.
  - Recorded in design.md as the exception to "icon + word".
  - Two columns rather than three: three 48 px buttons don't fit under a third of a 360 px screen, and smaller targets would fail older guests.
- **Theme directions (item 4, not built):** a mockup board with three directions on the welcome (after the code check), menu and My Uploads screens. All three stay inside design.md (paper, ink, one olive accent, Instrument Serif names, Atkinson body, no shadows or gradients):
  - A Kad Klasik: framed and centred, monogram in a double ring.
  - B Moden Tenang: left-aligned, square stamp monogram, prints with a deeper bottom margin, no grain.
  - C Gerbang: the cover photo in an arch with the monogram on its sill, and faint paper fibres.

  The board is a private claude.ai artifact plus nine PNG screenshots in the session scratchpad. Waiting for Hidayah's choice before building.

### Files touched
| File | Change |
| --- | --- |
| `web/src/components/ui/BackLink.tsx`, `components/TopBar.tsx` | added: small "Kembali"; top-row slot |
| `web/src/components/ui/Screen.tsx`, `Icon.tsx`, `index.ts` | modified: `back` prop; `globe`, `arrowLeft` icons |
| `web/src/app/RootLayout.tsx`, `NotFoundPage.tsx`, `components/PlaceholderPage.tsx` | modified: top-row slot; back link |
| `web/src/features/entry/SpaceLayout.tsx`, `device/InAppBrowserScreen.tsx` | modified: in-app link, notice reopened with "Kembali", link with the code |
| `web/src/features/entry/CodeScreen.tsx`, `StatusScreens.tsx`, `AliasInactivePage.tsx`, `device/CameraHelpPage.tsx` | modified: back links |
| `firestore.rules`, `shared/src/media.ts`, `rules-tests/tests/firestore-media.test.ts` | modified: snapshot may be video; tests |
| `web/src/lib/queue/capture.ts`, `runner.ts`, `features/capture/captureActions.ts`, `LargeFilePrompt.tsx`, `features/menu/MenuPage.tsx` | modified: camera video, held large video, wifi question for it |
| `web/tests/queue.test.ts` | modified: held camera video test |
| `web/src/features/uploads/MyUploadsPage.tsx` | modified: grid, icons, status marks, legend |
| `web/src/i18n/ms.json`, `en.json` | modified: `common.back`, `capture.largeBodyVideo`, `uploads.legendName`, `uploads.icons.*` |
| `CHANGELOG.md`, `docs/ai/memory.md`, `docs/product/design.md`, `docs/ai/worklog.md` | modified: entries, D-084 to D-086, S-03/D-009 notes, design exception, this entry |

### Commands run and results
| Command | Result |
| --- | --- |
| `npm run typecheck` | clean (also each commit on its own) |
| `npm run test:unit` | shared 46, web 40 passed (+1 held camera video) |
| `npm run test:emulators` | 83 passed (+1 snapshot video rule) |
| Mockup screenshots (headless Chrome, 390 px) | 9 screens rendered and reviewed |

### Decisions
- D-084, D-085, D-086 (memory.md). S-03 and D-009 marked as narrowed by D-084.

### Problems, risks, open questions
- **Backend deploy needed after merge:** the rule change only takes effect after Hidayah runs `npm run deploy:backend`. Until then the live project refuses camera videos (the item would fail with a permission error and show "!").
- **Android picker behaviour:** with both `image/*` and `video/*`, some Android phones open a chooser (camera / camcorder) instead of the camera directly. Needs the phone test; iPhone opens the camera with a Photo/Video switch.
- Camera videos are copied into IndexedDB. Very long videos rely on the browser's storage quota; when it is full the existing fallback keeps the file in the page and asks the guest to keep it open.
- The in-app link loses the event code after a reload in the in-app browser (memory only). Then Chrome/Safari shows the code screen. "Jemput Kawan" (D-076) will let members get the code back.
- Emulator smoke tests and a live preview check of the new screens are still to run, after the theme is built, before the PR.
- Tooling: staging single hunks with `git apply --unidiff-zero` put one line in the wrong place, and a stash pop carried it into the working copy. Caught by typechecking each commit alone and fixed before committing. Staging now uses HEAD + exact edits (`git update-index --cacheinfo`).

### Next steps
- [ ] Hidayah picks a theme direction (A, B or C, or a mix); build it.
- [ ] Smoke tests on the emulators, preview deploy, live check, then open the PR.
- [ ] After merge: Hidayah runs `npm run deploy:backend` for the snapshot video rule.
- [ ] Phone checks: Snap Gambar video on Android (picker) and iPhone, the in-app link in Instagram/Facebook, the My Uploads grid.
- [ ] Then "Jemput Kawan" (D-076).

### Commits
- `3cd643d` feat(device): small open-in-browser link and back links
- `051414a` security(capture): Snap Gambar opens the phone camera for photo or video
- `f1bf42a` feat(uploads): My Uploads as a compact preview grid with small icons
- docs commit with this entry

---

## 2026-10-31 11:30 — Phase 1c: fast name screen, privacy step, My Uploads, device handling

- **Agent / model:** Claude Code (Claude Opus 5.5), VS Code extension, Windows
- **Version / branch:** v0.1 (+ unreleased) / `feat/phase-1c`
- **Phase:** Phase 1 (target v0.2), PR 1c of 3
- **Goal:** The approved 1c plan with Hidayah's choices (privacy question after capture, small previews kept on the phone, in-app notice that never blocks) and additions:
  1. Fast name screen: "Cuba lagi" after 15 s, name kept.
  2. In-app notice before any join or address change.
  3. A file landing after its item was deleted mid-upload is removed, with a test.
  4. Closing at the privacy question sends Peribadi and keeps `lastVisibility` null.
  5. My Uploads merges phone and server by `mediaId`.

  Also recorded D-077: keep `joinEvent` warm only during an event's window, planned for Phase 4/5.

### What changed and why
- **Fast name screen (D-078):** a first-time guest on a QR link types their name on a neutral screen while sign-in and `joinEvent` run. The couple's names and theme now appear on the selfie screen (it gained the couple header). Wrong code → code screen. 15 s without an answer after "Teruskan" → "Cuba lagi", with the typed name kept.
- **Event screens load during the name step (D-083):**
  - Selfie, menu, privacy, My Uploads and gallery moved to a lazy chunk, fetched while the guest types.
  - The first screen is now 144.6 KB (gzip -9 sum of the scripts the page preloads). Before the move it was close to the 150 KB limit.
- **Device handling (D-081, D-082):**
  - In-app browser notice ("Buka dalam Chrome" / Safari steps, "Salin pautan", "Teruskan di sini"), shown before anything joins.
  - "Kamera tidak terbuka?" help after a cancelled camera.
  - In-memory queue database (`fake-indexeddb`, now a runtime dependency loaded only in this case) when the phone refuses IndexedDB. Dexie's live updates do not see that database, so the menu re-reads it every second.
  - Found while testing: the menu's hidden file pickers changed place between screens, so a photo taken from the help screen would have been lost. They now keep one position.
- **Privacy step (D-079):**
  - Full-screen Peribadi / Awam, then the name question for Awam.
  - Camera photos wait with `awaitingChoice`; a gallery selection is asked before the wifi question.
  - Leaving or reloading at the question → Peribadi, asked again next time.
  - Menu switch afterwards; the choice is kept on the phone and on the guest record.
  - The locked-gallery notice has a Snap Gambar shortcut.
- **My Uploads (D-080):**
  - `/s/:publicId/:eventSlug/mine`, merged by `mediaId`.
  - Status per item, Peribadi / Awam switch, Padam with a confirmation screen.
  - Deleting during an upload aborts it and the queue never sends that item again.
  - A privacy switch made while the doc is being created is applied right after.
  - Photo previews (~320 px) are made in a Web Worker and kept on the phone.
  - The menu button appears once there is an item; "Majlis saya" links to each event's uploads with the count sent from this phone.
- **Bug fixed, found in the preview screenshots:** My Uploads showed "Belum sampai" for a sent photo, because the server list was read before the server had processed the upload. The phone now decides "sent"; the server only adds a refusal (`d2e7ab7`, with a test).
- **No security-rule or function code changes.** The existing rules already allowed every 1c flow. New tests prove them: switching and deleting after the upload landed, and the trigger removing a file that lands after a mid-upload delete.

### Files touched
| File | Change |
| --- | --- |
| `web/src/features/entry/EventRoute.tsx`, `SpaceLayout.tsx`, `MyEventsPage.tsx` | neutral join flow, lazy event screens, in-app gate, My Uploads links |
| `web/src/features/onboarding/WelcomePage.tsx`, `SelfiePage.tsx`, `guestSync.ts`, `EventHome.tsx` | neutral mode, couple header on the selfie screen, privacy choice on the guest record |
| `web/src/features/menu/MenuPage.tsx` | privacy step and switch, camera help, storage notice, My Uploads button, fixed picker position |
| `web/src/features/privacy/*`, `features/uploads/*`, `features/device/*` | added: privacy screens, My Uploads, in-app and camera help screens |
| `web/src/lib/queue/*` | `awaitingChoice`, `choose`, `setVisibility`, `remove` with abort, `saveThumb`, `hasUnsent`, thumbs table (Dexie v2), in-memory fallback |
| `web/src/lib/media/thumbnail*.ts`, `lib/device/inAppBrowser.ts`, `copyText.ts` | added: preview worker, in-app detection, copy link |
| `web/src/components/ui/Icon.tsx`, `web/src/i18n/{ms,en}.json` | icons `userHidden`, `trash`; strings `device`, `privacy`, `uploads`, `mine`, `welcome.title` |
| `web/tests/{queue,inAppBrowser,mergeItems}.test.ts`, `rules-tests/tests/{firestore-media,functions-media}.test.ts` | new tests |
| `web/package.json`, `package-lock.json` | `fake-indexeddb` moved to dependencies |
| `CHANGELOG.md`, `docs/ai/memory.md`, `docs/ai/worklog.md` | changelog, D-077 to D-083, status, this entry |

### Commands run and results
| Command | Result |
| --- | --- |
| Name box ready, preview, Slow 4G + 4x CPU, 4 runs each | before (main): 4.45 / 4.49 / 4.54 / 4.62 s; after: 2.43 / 2.46 / 2.56 / 2.62 s |
| Name-screen edge cases on the preview | 8/8: wrong code → code screen without couple info; offline → "Cuba lagi" keeps the name; join held 15.0 s → "Cuba lagi" → joins |
| `npm test` (with `FUNCTIONS_DISCOVERY_TIMEOUT=60`) | shared 46, web 38 (39 after the merge fix, unit run), emulators 82; typecheck clean |
| Emulator smoke tests on the final code | 1b 15/15 (now answers the privacy question), device 15/15, privacy 15/15, My Uploads 16/16 |
| Preview deploy + live check on `guestcam-2026` (test space #00100) | 8/8: in-app notice, neutral name screen, selfie with couple, privacy question, upload, My Uploads with preview, delete; no page errors. The delete ran `onMediaDeleted` live for the first time |
| Screenshots of every new screen (390 px) | reviewed against design.md: paper, one accent, 64 px buttons, no banned patterns |

### Decisions
- D-077 to D-083 in memory.md.

### Problems, risks, open questions
- First-screen size: the commit message of `c11f33c` compares Vite's reported sizes (about 147 KB before) with a gzip -9 sum (about 143 KB after); from now on sizes in docs are gzip -9 sums of every script the page preloads.
- Previews are not made where the browser cannot decode the photo in a worker (HEIC on Android Chrome, older Safari without OffscreenCanvas); those show an icon. Not yet tried on a real iPhone.
- The "Buka dalam Chrome" link and "Salin pautan" have not been tried inside a real Instagram or Facebook app yet; the iPhone Safari steps text is generic for each app's menu.
- The camera "cancel" event exists only in newer browsers (Chrome 113+, Safari 16.4+); older ones simply never show "Kamera tidak terbuka?".
- Phase 3 still open: copy the guest's name onto public items (P2), stale `queued` clean-up (U2).

### Next steps
- [ ] Hidayah: phone checklist on the preview (Android Chrome; iPhone Safari and WhatsApp/Instagram when available), review and squash-merge
- [ ] "Jemput Kawan" (D-076) as its own PR
- [ ] iPhone checks, then v0.2 when Hidayah asks

### Commits
- `a229bbd` docs: record event-day warm joinEvent as a Phase 4/5 task
- `ec24ec9` perf(entry): show a neutral name screen while the QR code is checked
- `4e4c2f1` feat(device): offer Chrome or Safari in in-app browsers; camera and storage help
- `c11f33c` perf(web): load the event screens while the guest types their name
- `562056f` feat(privacy): ask Peribadi or Awam on the first upload, then a switch
- `94945c0` feat(uploads): My Uploads with status, privacy switch, delete and previews
- `d2e7ab7` fix(uploads): show a sent item as sent before the server has processed it
- (this commit) docs: record Phase 1c decisions, changelog and work log

---

## 2026-10-31 10:20 — First-load speed, safe app updates, sent-listener fix

- **Agent / model:** Claude Code (Claude Opus 5.5), VS Code extension, Windows
- **Version / branch:** v0.1 (+ unreleased) / `perf/first-load` (on top of `feat/phase-1b-queue`)
- **Phase:** Phase 1 (target v0.2), between PR 1b and 1c
- **Goal:** Hidayah found the event link slow to open and asked how to speed it up; she approved the plan (preload, early connections, earlier sign-in, drop the duplicate call, plus the app-update fix). She also asked for a guest "share the QR" feature, approved as D-076 and planned after 1c.

### What changed and why
- **Measured first** on the preview (headless Chrome, DevTools Slow 4G + 4x CPU, test space #00100): name screen 6.6-6.9 s. Most of it was waiting: Firebase code fetched only after the main code ran, then three server steps in a row (anonymous sign-up, Firebase's account lookup, `joinEvent`).
- **Speed (D-075):**
  - `web/src/boot.ts` is a separate async entry: it loads the Firebase core and starts anonymous sign-in on `/s/` links while the main code is still downloading. `main.tsx` imports it too, so the dev server behaves the same.
  - The build adds modulepreload links for the Firebase core chunks and preconnect links to the sign-in and functions servers (`firstLoadHints` plugin in `vite.config.ts`).
  - Dexie now has its own chunk. The bundler had put its shared helpers in Dexie's chunk, so the first screen loaded all of Dexie (~31 KB gzipped). The earlier "about 145 KB" first-screen figure in the 1b entry missed this: the 1b first screen was really about 175 KB. Now it is about 145 KB (main 109 + Firebase core 34 + small chunks).
  - Right after `joinEvent`, the app no longer asks the server for the same event again (`isEventFresh`, one minute, in memory only).
  - The Firebase chunk is precached for offline reopen, and a failed Firebase load is retried instead of staying broken until a reload.
- **Safe app updates (D-074):** a waiting new version is applied at a screen change or 5 s after the guest returns to the menu; never while saving a capture, during the wifi question, or while the queue holds a file only in memory (`canReloadSafely`). An open page checks for a new version on return at most every 30 minutes. Before this, a guest who stayed on the menu never got a fix deployed during the event.
- **Bug fix found by the smoke test (`73b072a`, also pushed to PR #6):** the queue kept "item sent" listeners in a Set; when the menu subscribed the same callback twice (React re-running the effect) and dropped the stale subscription, it removed the only entry, so the menu stopped re-checking the gallery unlock after uploads. Each subscription now has its own entry, with a test that fails without the fix.

### Files touched
| File | Change |
| --- | --- |
| `web/vite.config.ts` | first-load hints plugin, boot entry, Dexie chunk, Firebase chunk precached |
| `web/src/boot.ts`, `web/src/main.tsx`, `web/src/app/App.tsx` | early Firebase load and sign-in moved into the boot entry |
| `web/src/lib/firebase/region.ts`, `functions.ts`, `load.ts` | region constant shared with the build; retry a failed load |
| `web/src/features/entry/eventStore.ts`, `useEventView.ts` | skip the refresh right after joining |
| `web/src/lib/device/serviceWorker.ts`, `web/src/features/menu/MenuPage.tsx`, `web/src/lib/queue/index.ts`, `runner.ts` | safe app updates; queue reload guard; sent-listener fix |
| `web/tests/queue.test.ts` | 2 tests (reload guard, duplicate subscription) |
| `CHANGELOG.md`, `docs/ai/memory.md`, `docs/architecture/architecture.md`, `docs/ai/worklog.md` | D-074 to D-076, status, pitfall A1, this entry |

### Commands run and results
| Command | Result |
| --- | --- |
| Load timing on the preview, before | name screen 6.6 / 6.9 s (one cold run 8.3 s); sign-in started at 3.5-3.8 s |
| Load timing on the preview, after (4 runs) | name screen 5.2 / 5.3 / 5.3 / 5.7 s; sign-in starts at about 2.1 s. Unthrottled about 2.5-3 s. A batch taken while Google's sign-in server was slow measured 6.3-7.2 s, so server speed varies run to run |
| `npm test` (with `FUNCTIONS_DISCOVERY_TIMEOUT=60`) | shared 46, web 24, emulators 80, all passed |
| Smoke test in the emulators | 14/14 (first run 13/14: the sent-listener bug above) |
| Live check on the preview (`npm run deploy:preview`, test space #00100) | 6/6, no page errors |

### Decisions
- D-074 safe app updates, D-075 first-load hints, D-076 "Jemput Kawan" (approved, built after 1c).

### Problems, risks, open questions
- The name screen is still above the 3 s budget on Slow 4G: the three server steps take about 3 s and Firebase anonymous sign-in cannot skip them. Options for later: keep one `joinEvent` instance warm on event days (minimum instances, a few dollars a month; a cold start can add 2-5 s), and a lighter main bundle (343 KB raw; React, router, i18n and both language files).
- The functions emulator sometimes takes over 10 s to load our functions on this computer and every call fails with `internal`; `FUNCTIONS_DISCOVERY_TIMEOUT=60` fixes it (same cause as the first 1b deploy).
- Safe app updates are covered by code review and unit tests only; an end-to-end check needs a real phone (see next steps).
- Correction: the previous entry's time "2026-10-30 17:50" was UTC (Git Bash ignored the time zone); it was written on 2026-10-31 at about 01:50 Asia/Kuala_Lumpur.
- A stuck smoke-test process from this session (node, PID 19108, holding port 5175) could not be stopped by Claude; Hidayah can end it in Task Manager.

### Next steps
- [ ] Hidayah: review PR #6 (now including `73b072a`) and this PR; phone checklist
- [ ] After PR #6 is squash-merged, rebase `perf/first-load` onto `main`
- [ ] PR 1c, then "Jemput Kawan" (D-076)

### Commits
- `73b072a` fix(queue): keep a sent subscription when the same callback subscribes twice
- (this PR) perf(web): load Firebase and start guest sign-in while the app downloads
- (this PR) fix(web): apply app updates when guests return to the menu, never mid-upload
- (this PR) docs: record first-load speed, safe updates and Jemput Kawan

---

## 2026-10-30 17:50 — Phase 1b backend deploy and live check

- **Agent / model:** Claude Code (Claude Opus 5.5), VS Code extension, Windows
- **Version / branch:** v0.1 (+ unreleased) / `feat/phase-1b-queue` (PR #6)
- **Phase:** Phase 1 (target v0.2), PR 1b of 3
- **Goal:** Get the 1b backend live on `guestcam-2026`, update the preview, and check uploads end to end on the real project.

### What changed and why
- Hidayah ran `npm run deploy:backend -- --force` (Claude is not permitted to use `--force`). It took three tries:
  1. "User code failed to load ... Timeout after 10000". Nothing was deployed. Claude measured the bundle: it loads in under 1 s, and a `--dry-run` deploy got past the same step, so this was a slow cold start on Windows, not our code.
  2. Rules, indexes and the three callables deployed, but creating `onOriginalUploaded` and `onMediaDeleted` failed with first-time Eventarc permission errors ("Eventarc Service Agent", "storage.buckets.get denied").
  3. About 5 minutes later the same command created both triggers. Deploy complete.
- Claude deployed the preview channel with the 1b web build and ran a live check.
- `docs/setup/new-computer.md`: troubleshooting notes for these three deploy errors.

### Files touched
| File | Change |
| --- | --- |
| `docs/setup/new-computer.md` | modified: deploy troubleshooting notes |
| `docs/ai/memory.md` | modified: status (1b backend deployed) |
| `docs/ai/worklog.md` | modified: this entry |

### Commands run and results
| Command | Result |
| --- | --- |
| `npm run deploy:backend -- --force` (Hidayah) | third run: rules, indexes, 2 new triggers created, 3 callables unchanged |
| `firebase deploy --only functions --dry-run` | discovery fine; stops at the expected `--force` prompt |
| `npm run deploy:preview` | preview channel updated, expires 2026-11-07 |
| `npm run seed:project -- --project guestcam-2026` | #00100 exists, nothing written; links printed to the terminal only |
| Live check on the preview (headless Chrome, test space #00100) | 6/6: QR link joins; menu with Snap Gambar and Muat Naik, gallery locked; camera photo saved; camera photo + gallery photo + video reach "3 dah dihantar"; gallery unlocks after the trigger; no page errors |
| Read-only Admin SDK check of the test event | 3 media docs `uploaded` with `sortAt`, all 3 originals in Storage; only the new test guest has `galleryUnlocked: true` |

### Decisions
- None.

### Problems, risks, open questions
- The test event on `guestcam-2026` now holds 3 small test uploads from the live check. They are harmless test data in the internal space and can be deleted from My Uploads once 1c ships, which also exercises `onMediaDeleted` live.
- `onMediaDeleted` has not run live yet (no delete UI until 1c).

### Next steps
- [ ] Hidayah: phone checklist on the preview (Android Chrome now; iPhone Safari and WhatsApp when available), then review and squash-merge PR #6
- [ ] PR 1c: privacy step, My Uploads, device handling

### Commits
- (this commit) docs: record the Phase 1b deploy and live check

---

## 2026-10-29 01:00 — Phase 1b: Snapshot, Upload from Gallery, upload queue, media records

- **Agent / model:** Claude Code (Claude Opus 5.5), VS Code extension, Windows
- **Version / branch:** v0.1 (+ unreleased) / `feat/phase-1b-queue`
- **Phase:** Phase 1 (target v0.2), PR 1b of 3
- **Goal:** Snapshot, Upload from Gallery, the offline upload queue, media records with host-only metadata, Storage rules, and the upload and delete triggers (plan approved earlier, with Hidayah's changes: the server deletes files when a doc is deleted; the wifi question is asked once per selection at 50 MB).

### What changed and why
- **Rules (with 32 new tests):**
  - Media docs are created by members only, as `queued`, with every field validated. The feature must be entitled and enabled (rule 17), the upload window open, and `originalPath` tied to the uid and mediaId.
  - Owners may only switch visibility and show-name. The owner or space owners may delete.
  - `private/meta` is written once by the item's owner and read only by space owners.
  - Storage originals are create-only (`resource == null`): a matching queued doc must exist, and size and type must match it.
  - Members may see that a media doc doesn't exist (D-070).
- **Functions:**
  - `onOriginalUploaded`: queued → uploaded, `sortAt`, gallery unlock, plan limits enforced, orphans removed.
  - `onMediaDeleted`: deletes the original, derived copies and `private/meta`.
  - Server storage adapter on firebase-admin.
- **Web:**
  - Dexie upload queue: one item at a time, photos first, backoff, permanent errors stop at `failed`, resume after reload, re-pick by fingerprint, storage-full fallback, persistent storage.
  - Camera photos are saved before EXIF is read (D-071).
  - EXIF is read in a Web Worker with a whitelist; GPS goes to `private/meta`; capture time uses the photo's offset or Malaysia time.
  - The wifi question is asked once per selection and holds only the large files (D-072).
  - The menu gets a queue indicator, and the gallery tile unlocks after the first upload lands.
- Bundle: main 109.5 KB plus the Firebase core about 34 KB, so the first screen is about 145 KB gzipped. The queue, Firestore Lite, Storage and EXIF load lazily.

### Files touched
| File | Change |
| --- | --- |
| `firestore.rules`, `storage.rules` | media, private/meta, originals, existence check |
| `rules-tests/tests/{firestore-media,storage-media,functions-media}.test.ts`, `media.ts`, `guestClient.ts` | added; `functions-access.test.ts` uses the shared guest client |
| `functions/src/triggers/*`, `functions/src/storage/index.ts`, `functions/src/index.ts` | triggers, server storage adapter |
| `shared/src/media.ts`, `paths.ts`, `limits.ts`, `index.ts`, tests | media helpers, path parsing, 50 MB threshold |
| `web/src/lib/queue/*`, `web/src/lib/media/*`, `web/src/features/capture/*`, `MenuPage.tsx`, `EventHome.tsx`, `guestSync.ts`, i18n | queue, EXIF worker, capture UI |
| `web/tests/{queue,exifDate}.test.ts`, `web/package.json`, `package-lock.json` | tests; dexie, exifr, fake-indexeddb |
| `AGENTS.md`, `CHANGELOG.md`, `docs/ai/memory.md`, `docs/ai/worklog.md` | commands, changelog, D-070 to D-073, this entry |

### Commands run and results
| Command | Result |
| --- | --- |
| `npm run test:unit` | shared 46, web 22 (12 queue tests cover retry, duplicates, quota error, restart after reload, re-pick, held, offline and preparing) |
| `npm run test:emulators` | 80 passed (rules, callables, triggers), several runs |
| `npm run typecheck`, `vite build` | clean; first screen about 145 KB gzipped |
| Smoke test in the emulators (headless Chrome, throttled network) | 14/14: camera photo + gallery photo + video uploaded; gallery unlocks; offline capture sent when back online; 60 MB file asks the wifi question once; reload mid-upload → "perlu dipilih semula" → re-pick continues the same item; exactly 5 items on the server, the large file whole; no page errors |
| `firebase deploy --only firestore:rules,firestore:indexes,storage,functions` | **Not deployed.** The CLI requires `--force` to accept the retry policy of the new triggers, and Claude was not permitted to run the `--force` deploy. Nothing was released; the live project still runs the 1a rules and functions |

### Decisions
- D-070 to D-073 in memory.md.

### Problems, risks, open questions
- The smoke test found a real bug: the owner-only read rule blocked the queue's "does it exist" check, so every first upload failed. Fixed in `e2d678f` with tests (D-070). The rules tests had missed it because they only read existing docs.
- Two emulator quirks were worked around in tests, not in rules:
  - An overwrite attempt right after an upload can arrive before the emulator has registered the file, so the test waits for its metadata first.
  - Storage clean-up between tests can lag, so the overwrite test uses its own media id.
- `npm audit`: 4 low-severity findings in `deepmerge` (via `workbox-build` in `vite-plugin-pwa`), build-time only. The only offered fix is a breaking downgrade; left as is.
- The backend deploy for 1b needs `npm run deploy:backend -- --force` run by Hidayah (or permission for Claude).
- Phase 3 task still open: clean up stale `queued` media docs (U2).

### Next steps
- [ ] Hidayah: run `npm run deploy:backend -- --force`; then Claude deploys the preview and runs a live check
- [ ] Phone checklist (Android Chrome now; iPhone Safari and WhatsApp when available)
- [ ] PR 1c: privacy step, My Uploads, device handling

### Commits
- `af1f5e7` security(rules): add media, private/meta and original upload rules
- `8e3f35c` feat(functions): add upload and delete triggers and the server storage adapter
- `2b5f656` feat(capture): add Snapshot, Upload from Gallery and the offline upload queue
- `e2d678f` fix(rules): let members check that a media doc does not exist yet
- (this commit) docs: record Phase 1b decisions, changelog and work log

---

## 2026-10-28 02:00 — Phase 1a follow-up: test space #00100, lock scope, safe seed

- **Agent / model:** Claude Code (Claude Opus 5.5), VS Code extension, Windows
- **Version / branch:** v0.1 (+ unreleased) / `feat/phase-1a-entry` (PR #5)
- **Phase:** Phase 1 (target v0.2), PR 1a
- **Goal:** Hidayah's changes before seeding:
  1. Test space is #00100, which she reserved for testing.
  2. Document the Google Cloud CLI as a non-conda tool.
  3. `seed:project` must create only #00100 and its event, never overwrite, and never touch #00000 or #10000+.
  4. The space-wide wrong-code lock must block only typed codes; QR links keep working under the device and IP limits.

  Then seed `guestcam-2026` and show the test link and code in the terminal only.

### What changed and why
- `seed:project`:
  - Creates only the four documents of #00100 (space, publicIds entry, event, event access), all with `create()`, so nothing can be overwritten.
  - Stops if #00100 exists, and refuses numbers outside 00002-09999.
  - No longer writes `counters/spaces` or `catalog/current`.
- `joinEvent`: the space lock is enforced only when no event slug is sent (the plain code screen). Wrong codes with a slug still count toward the space limit and its audit entry. `rateLimits.ts` gained an `enforce` flag per key.
- Tests: replaced the space-lock test with three:
  - typed codes are blocked after 300 wrong codes;
  - QR links keep joining during a lock;
  - wrong QR codes still trip the lock and its audit entry.
- Docs: `new-computer.md` and an `environment.yml` comment say the Google Cloud CLI comes from Google's Windows installer, not conda. Memory D-067 to D-069; ADR-0007 amendment.

### Files touched
| File | Change |
| --- | --- |
| `functions/src/access/joinEvent.ts`, `functions/src/access/rateLimits.ts` | space lock scope, `enforce` flag |
| `rules-tests/tests/functions-access.test.ts` | three space-lock tests |
| `scripts/seed-project.ts` | create-only #00100 |
| `docs/setup/new-computer.md`, `environment.yml` | gcloud as a non-conda tool |
| `docs/ai/memory.md`, `docs/decisions/0007-guest-access-through-callables.md`, `docs/ai/worklog.md` | D-067 to D-069, amendment, this entry |

### Commands run and results
| Command | Result |
| --- | --- |
| `npm test` (twice in a row) | 44 + 8 + 42 passed both times; ports freed before and after |
| `firebase deploy --only functions:joinEvent` | updated in asia-southeast1 |
| `npm run seed:project -- --project guestcam-2026` | created #00100 (internal) with event `tunang`; link and code printed to the terminal only |
| Same command again | "already exists. Stopped; nothing was written." |
| Headless Chrome on the preview with the test QR link | joined, address cleaned to `/s/…/tunang`, welcome shows "Pasangan Ujian"; no console errors (this created one anonymous test member in #00100) |

### Decisions
- D-067 space lock scope (supersedes the lock part of D-058), D-068 safe live seed, D-069 gcloud outside conda.

### Problems, risks, open questions
- One `npm test` run failed all 12 callable tests at once while every rules test passed; the next three runs were clean. The output wasn't kept, so the cause is unknown (possibly a slow Functions emulator start). Watch for it again.
- D-067 trade-off: any caller can send a slug, so per-slug guessing is bounded only by the device and IP limits until App Check (Phase 5).
- The seed prints links on `guestcam-2026.web.app` (the live channel), which doesn't have this app yet. Test on the preview channel with the same path.

### Next steps
- [ ] Hidayah: phone checklist on the preview with the #00100 test link (from the terminal), then review and merge PR #5
- [ ] PR 1b: Snapshot, Upload from Gallery, queue, media records, Storage rules, upload and delete triggers

### Commits
- `e9502a0` chore(seed): use internal test space #00100 for the real project
- `a52e4af` security(access): space lock blocks only typed codes; create-only test seed
- (this commit) docs: log the #00100 seed and lock-scope follow-up

---

## 2026-10-28 00:30 — Phase 1a: entry, identity, menu

- **Agent / model:** Claude Code (Claude Opus 5.5), VS Code extension, Windows
- **Version / branch:** v0.1 (+ unreleased) / `feat/phase-1a-entry`
- **Phase:** Phase 1 (target v0.2), PR 1a of 3
- **Goal:** Plan approved by Hidayah with changes (per-space wrong-code limit with audit entry; codes unique within a space; server deletes files when a media doc is deleted; one large-file question per selection at 50 MB; note stale "queued" cleanup for Phase 3). Build 1a: entry, identity, menu, rules for spaces/events/guests; deploy rules, indexes and functions to `guestcam-2026` and seed test space #10001.

### What changed and why
- **shared:**
  - Callable contracts (`EventView`, resolve/join requests and responses).
  - `pickCurrentEvent`, `mergeTheme`, unique code and public id generation, rate-limit policies and `recordFailure`.
  - Types: `Guest.selfiePath`, nullable `lastVisibility`, `Media.sortAt`, `RateLimit`, audit action `spaceCodeEntryLocked`.
- **Rules (ADR-0007):**
  - Guests never read `spaces/*`. Events are readable by members and space owners. Codes and members are server-written.
  - Guest profiles: only that member writes them, with validated fields; `galleryUnlocked` and `firstUploadAt` are server-only.
  - Storage: the selfie (own path, image under 15 MB, members only; readable by the guest and space owners). Everything else stays denied.
- **Functions:**
  - `joinEvent` (constant-time code check, linked events, device/IP/space limits, audit entry on a space lock).
  - `resolveCurrentEvent` (current event among joined events, otherwise `codeRequired`).
- **Web:**
  - React Router in declarative mode; Firestore Lite; Firebase core preloaded.
  - Code screen; join with `replaceState`; cached event view; theme accent.
  - Welcome/name → selfie (front camera, Langkau) → menu, with the profile remembered per space and synced to the server when online.
  - Menu from effective features ("Akan datang" until 1b, Galeri locked); `/mine`; alias inactive page; production root page; dev index for the dev server only.
- **Storage adapter:** real resumable `uploadFile` and a new `fileExists` (pitfall U1).
- **Scripts:**
  - `seed:project` (real project, code printed to the terminal only) and `deploy:backend`.
  - The dev seed checks that codes are unique within each space.
  - `test:rules` renamed to `test:emulators`, which now also covers callable-function tests.
- **Deploy blocker fixed:** `functions/package.json` listed `@guestcam/shared`, which Cloud Build would try to download from npm. It's removed; the code is bundled anyway.
- `npm dedupe`: two `@firebase/app` patch versions broke the functions client in tests.

### Files touched
| File | Change |
| --- | --- |
| `shared/src/{api,codes,currentEvent,rateLimit}.ts`, `limits.ts`, `types.ts`, `paths.ts`, `tests/access.test.ts` | added/modified |
| `firestore.rules`, `storage.rules`, `rules-tests/tests/*` | rules for 1a; 30 rules tests + 10 callable tests; deny-all test replaced |
| `functions/src/access/*`, `functions/src/firebase.ts`, `functions/src/index.ts`, `functions/package.json` | added/modified |
| `web/src/**` | entry, onboarding, menu, gallery placeholder, firebase/storage libs, device stores, icons, i18n |
| `scripts/seed-project.ts`, `scripts/seed-dev.ts`, `package.json`, `package-lock.json` | added/modified |
| `docs/decisions/0007-guest-access-through-callables.md`, `docs/decisions/README.md` | ADR-0007 |
| `AGENTS.md`, `CHANGELOG.md`, `docs/setup/new-computer.md`, `docs/ai/memory.md`, `docs/ai/worklog.md`, `docs/ai/prompts/phase-1-mvp.md` | modified/added |

### Commands run and results
| Command | Result |
| --- | --- |
| `npm run test:unit` | shared 44, web 8 passed |
| `npm run test:emulators` | 40 passed (30 rules, 10 callable end-to-end) |
| `npm run typecheck` | clean |
| `vite build` | first screen 142 KB gzipped (main 106.6 + Firebase core 33.7 + loaders 1.5); profile sync chunk 39.6 KB loads after onboarding |
| Local smoke test in the emulators (headless Chrome, 390 px) | 17/17: QR join removes the code, welcome, empty name refused, selfie skip, menu, locked gallery hint, guest doc written, space link reopens, wrong code → neutral code screen without names, typed code joins, alias inactive, malformed id not found |
| `firebase deploy --only firestore:rules,firestore:indexes,storage,functions` | rules, indexes, `ping`, `resolveCurrentEvent`, `joinEvent` (Node 24, asia-southeast1) created; APIs enabled automatically; artifact cleanup policy set to 1 day |
| Live checks | `ping` ok; unauthenticated `joinEvent` refused; preview `/s/<unknown>` → code screen → wrong code answered by the live function; no console errors |
| `npm run deploy:preview` | https://guestcam-2026--preview-s6g4gj5a.web.app (expires 2026-11-04) |

### Decisions
- D-057 to D-064 in memory.md; ADR-0007.

### Problems, risks, open questions
- **Seeding the real project is blocked on credentials.** The Admin SDK needs Google Application Default Credentials. conda-forge has no `gcloud`, and the Firebase CLI login can't be used by scripts. Options are in memory.md's open questions.
- Space #10001 is the friend's engagement number (D-042). Update: Hidayah moved the test space to #00100 (plan `internal`), so #10001 stays free (D-066).
- A space-wide code lock could block real guests for 15 minutes; hosts need an "unlock code entry" action (Phase 4).
- **Phase 3 task (Hidayah, 2026-10-27):** a scheduled cleanup of stale `status: "queued"` media docs whose upload never arrived (pitfall U2).
- The selfie is uploaded when the menu opens. If that fails, it retries on the next menu open; it isn't in the upload queue (1b could add it).

### Next steps
- [ ] Hidayah: set up Google Cloud CLI credentials (D-065); then Claude seeds #00100 and prints the test link
- [ ] Hidayah: phone checklist on the preview (iPhone Safari, iPhone via WhatsApp, Android Chrome), review and merge PR 1a
- [ ] PR 1b: Snapshot, Upload from Gallery, queue, media records, Storage rules, upload and delete triggers
- [ ] PR 1c: privacy step, My Uploads, device handling

### Commits
- `6e3260c` security(rules): add access rules for spaces, events, members and guests
- `e3f81fb` feat(access): add resolveCurrentEvent and joinEvent callables
- `18d8c70` feat(entry): join events by QR or code, name and selfie, event menu
- (this commit) docs: record Phase 1a decisions, ADR-0007 and commands

---

## 2026-10-27 02:00 — Emulator cleanup script

- **Agent / model:** Claude Code (Claude Opus 5.5), VS Code extension, Windows
- **Version / branch:** v0.1 (+ unreleased) / `chore/emulator-cleanup`
- **Phase:** tooling between Phase 0 and Phase 1
- **Goal:** Windows leaves `java.exe` holding emulator ports after tests. Add `npm run emulators:kill` (PowerShell) for ports 4000, 4400, 4500, 5001, 8080, 8085, 9099, 9199, run it before and after `npm test`, keep the tests on `firebase emulators:exec`, update new-computer.md, open a PR.

### What changed and why
- `scripts/kill-emulators.ps1`: finds the processes listening on those ports and stops them, but only `java.exe`/`node.exe` whose command line identifies a Firebase emulator. Any other app on those ports (8080 is common) is reported and left running. `-DryRun` lists what would be stopped.
- `scripts/emulators-kill.mjs`: runs the PowerShell script on Windows and exits quietly on macOS/Linux, so `npm test` keeps working on CI.
- `package.json`: `emulators:kill`, `pretest` and `posttest`. `test:rules` already uses `firebase emulators:exec` (unchanged).
- Docs: new-computer.md (what the script does, when it runs, manual use after Ctrl+C), AGENTS.md Commands, memory.md D-056; the open question about the Windows leak is closed.

### Files touched
| File | Change |
| --- | --- |
| `scripts/kill-emulators.ps1`, `scripts/emulators-kill.mjs` | added |
| `package.json` | modified: `emulators:kill`, `pretest`, `posttest` |
| `docs/setup/new-computer.md`, `AGENTS.md`, `docs/ai/memory.md`, `docs/ai/worklog.md` | modified |

### Commands run and results
| Command | Result |
| --- | --- |
| `npm run emulators:kill -- -DryRun` | "all emulator ports are free" |
| `npm test` | pretest: ports free; 34 + 7 + 3 passed; posttest: "stopped java.exe (PID 9612) on port(s) 8080"; afterwards no emulator port in use; exit 0 |

### Decisions
- D-056: emulator cleanup script, run before and after `npm test`; stops Firebase emulator processes only.

### Problems, risks, open questions
- npm skips `posttest` when the tests fail; the next `npm test` cleans up in `pretest`, and `npm run emulators:kill` can be run by hand.
- The script does not cover the Hosting emulator (5000) or the Firestore websocket (9150). 9150 belongs to the same `java.exe` as 8080, so it is freed with it.

### Next steps
- [ ] Hidayah: review and merge the PR
- [ ] Phase 1

### Commits
- (this commit) chore: free emulator ports before and after tests on Windows

---

## 2026-10-27 01:30 — Release v0.1

- **Agent / model:** Claude Code (Claude Opus 5.5), VS Code extension, Windows
- **Version / branch:** v0.1 / `chore/release-v0.1`
- **Phase:** Phase 0 (Setup), release
- **Goal:** After Hidayah squash-merged PR #1 (`4099a0a`), release v0.1 following `docs/versions/VERSIONING.md`. No production deploy.

### What changed and why
- `CHANGELOG.md`: `[Unreleased]` items moved under `[0.1] - 2026-10-27`, plus the spec and the Node 24 change.
- `docs/versions/v0.1.md`: release note from the template.
- `VERSION` set to `0.1`. All five `package.json` files were already `0.1.0`.
- `docs/ai/memory.md`: status shows v0.1 released and Phase 1 next.
- The release goes through a pull request (VERSIONING.md: changes reach `main` by PR). The tag `v0.1` and the GitHub Release are made on the merged commit, after a full `npm test` on `main`.

### Files touched
| File | Change |
| --- | --- |
| `CHANGELOG.md`, `VERSION`, `docs/versions/v0.1.md` | modified/added: release |
| `docs/ai/memory.md`, `docs/ai/worklog.md` | modified: status and this entry |

### Commands run and results
| Command | Result |
| --- | --- |
| `npm run test:unit` on `main` (`4099a0a`) | 34 + 7 passed |
| `npm run typecheck`, `npm run build` on `main` | clean, ok |
| `npm test` (full, branch head `b206aad`, same code) | 34 + 7 + 3 passed |

### Decisions
- None new.

### Problems, risks, open questions
- Release step 1 asks for the preview to be checked on a real iPhone and Android. No device results were reported before this release; the release note says "Not yet reported".
- Update after merge: Hidayah reported iPhone Safari OK; Android Chrome not tested. Recorded in `docs/versions/v0.1.md` before tagging.
- Port 8080 was still held by the Firestore emulator from the previous test run (PID 39160), so the full `npm test` on `main` waits until it is closed.
- GitHub does not actually protect `main` (branch protection API returns "Branch not protected"), although VERSIONING.md calls it protected.

### Next steps
- [ ] Hidayah: close PID 39160, squash-merge the release PR
- [ ] Claude: full `npm test` on `main`, tag `v0.1`, GitHub Release
- [ ] Optional: turn on branch protection for `main` on GitHub
- [ ] Phase 1

### Commits
- (this commit) chore(release): v0.1

---

## 2026-10-27 01:00 — Switch to Node 24

- **Agent / model:** Claude Code (Claude Opus 5.5), VS Code extension, Windows
- **Version / branch:** v0.1 (unreleased) / `feat/phase-0-skeleton`
- **Phase:** Phase 0 (Setup), follow-up
- **Goal:** Hidayah asked to move from Node 22 to Node 24 everywhere, put the rules tests on the current Firebase SDK, record the decision, then open the Phase 0 PR. She also confirmed Firestore and Storage are in asia-southeast1.

### What changed and why
- `environment.yml` `nodejs=24`; `engines.node: "24"` in all five package.json files (root, shared, web, functions, rules-tests); `.nvmrc` 24; Functions runtime `nodejs24` in `firebase.json`; esbuild target `node24`.
- Rules tests moved to `@firebase/rules-unit-testing` 6 + `firebase` 13, the same SDK as the web app (D-052 superseded by D-055).
- Lock file regenerated under Node 24.22.1 / npm 11.19.1.
- memory.md: D-055, S-12, Runtime row, region confirmed; Node 22 vs 24 open question removed. new-computer.md: Node 24 note and upgrade steps. AGENTS.md and README: Node 24.

### Files touched
| File | Change |
| --- | --- |
| `environment.yml`, `.nvmrc`, `firebase.json` | modified: Node 24, `nodejs24` |
| `package.json`, `shared/package.json`, `web/package.json`, `functions/package.json`, `rules-tests/package.json`, `package-lock.json` | modified: engines 24, node24 build target, rules-test SDK 6/13 |
| `AGENTS.md`, `README.md`, `docs/setup/new-computer.md`, `docs/ai/memory.md`, `docs/ai/worklog.md` | modified |

### Commands run and results
| Command | Result |
| --- | --- |
| `conda env update -n guestcam -f <repo>/environment.yml --prune` (run by Hidayah) | Node v24.22.1. A first run from `C:\Users\User` did nothing because the yml was not in that folder |
| `npm install` (lock refresh) | firebase 13.1.0 and rules-unit-testing 6.0.0 everywhere; 0 vulnerabilities |
| `npm ci` | 659 packages, no engine warnings, 0 vulnerabilities |
| `npm test` | shared 34, web 7, rules 3: all passed |
| `npm run typecheck` | clean |
| `npm run build` | web first load 119 KB gzipped; functions bundle 3.3 KB (node24) |

### Decisions
- D-055: Node 24 everywhere, one Firebase SDK version (supersedes D-052).

### Problems, risks, open questions
- The first `npm ci` failed with EPERM because the Vite dev server Claude started in the previous session was still running and locking a native file. `TaskStop` on Windows stops only the shell wrapper, not the node/java child. Hidayah ended it manually. Claude will avoid leaving long-lived servers running on this machine.
- `npm test` again left the Firestore emulator (`java.exe`) on port 8080 after `emulators:exec`, so the Windows leak is not caused by Node 22. Still open in memory.md.

### Next steps
- [ ] Hidayah: review and squash-merge the Phase 0 PR
- [ ] Then: release v0.1 (changelog, `docs/versions/v0.1.md`, VERSION, package versions, tag, GitHub Release; no production deploy)

### Commits
- (this commit) chore: switch to Node 24 and the current Firebase SDK for rules tests

---

## 2026-10-27 00:30 — Phase 0 skeleton

- **Agent / model:** Claude Code (Claude Opus 5.5), VS Code extension, Windows
- **Version / branch:** v0.1 (unreleased) / `feat/phase-0-skeleton`
- **Phase:** Phase 0 (Setup)
- **Goal:** Empty but correctly structured skeleton that runs against the emulators, passes its tests and deploys to a Hosting preview channel (prompt `docs/ai/prompts/phase-0-setup.md`). Plan approved by Hidayah; footer owner "Hidayah"; push as we go.

### What changed and why
- **Monorepo:** npm workspaces `shared`, `web`, `functions`, `rules-tests`; strict base tsconfig; Node 22 pinned; `.gitattributes` for LF. `.gitignore` had a bare `lib/` rule that would have hidden `web/src/lib/`; narrowed to `/functions/lib/`.
- **shared/:** data model types (Space, SpaceHost, AliasBooking, Event, EventAccess, EventMember, Guest, Media + host-only MediaPrivateMeta, Wish, Folder, FolderAccess, FolderMember, Catalog, Purchase, BugReport, AuditLogEntry and enums), path builders with segment validation and `isOriginalPath` (M1), `parseEntry` (last hyphen, lowercase, reserved slugs; a valid code after a bad slug makes the entry invalid), `location.ts` (permanent `/s/:publicId` vs alias), per-plan limits, feature catalog with packages, `isFeatureAvailable` and `computeEntitlements`.
- **web/:** React 19, Vite 8, React Router, Tailwind 4. Tailwind's default palette is removed, so only token colours exist. Self-hosted Latin-subset fonts (56 KB). Button, Tile, Screen, LanguageToggle. i18next with Malay as the default. Placeholder pages for every route, each showing its name in both languages; `/` is a Phase 0 index of all pages. Footer with copyright, version `vA.B (commit)` and a Lapor Masalah placeholder. `/login` and `/admin` are lazy chunks.
- **Firebase:** `firebase.json` (Firestore, Storage, Functions on Node 22 in asia-southeast1, Hosting SPA rewrite, emulators), deny-all rules, Hosting headers (no-cache for HTML and `sw.js`, immutable for `/assets`). Functions: a `ping` callable, the `PUBLIC_BASE_URL` param, an esbuild bundle that includes the shared code, and the server storage adapter interface.
- **Dev wiring:** on the dev server the web app uses the emulators (demo project) and Anonymous Auth with one shared sign-in. Before that fix, StrictMode created two anonymous accounts. The SDK is a lazy chunk.
- **Storage adapter:** interface with the five operations; the Firebase stub rejects with "not implemented".
- **PWA:** app shell precached; updates applied at the next route change, `holdUpdates()` for capture screens.
- **Scripts and docs:** `scripts/seed-dev.ts` (spaces #00000 → #00001 → #10001, counter, catalog), env examples, AGENTS.md Commands, README, new-computer.md, CHANGELOG `[Unreleased]`.
- Moved the Firebase web config from `docs/setup/.env.local` (an untracked JS snippet) to `web/.env.local` as `VITE_FIREBASE_*` variables and deleted the old file. Neither file is committed.

### Files touched
| File | Change |
| --- | --- |
| `package.json`, `package-lock.json`, `tsconfig.base.json`, `.nvmrc`, `.gitattributes`, `.gitignore` | added/modified: workspaces, scripts, grpc override |
| `shared/**` | added: package, 6 modules, 4 test files |
| `web/**` | added: Vite app, styles and fonts, components, i18n, routes and pages, lib/firebase, lib/storage, lib/device/serviceWorker, icons, tests |
| `functions/**` | added: package, config, index, health, storage adapter interface |
| `rules-tests/**` | added: setup and deny-all tests |
| `firebase.json`, `.firebaserc`, `firestore.rules`, `storage.rules`, `firestore.indexes.json` | added |
| `scripts/seed-dev.ts`, `scripts/tsconfig.json` | added |
| `.env.example`, `web/.env.example`, `functions/.env.example` | added |
| `AGENTS.md`, `README.md`, `CHANGELOG.md`, `docs/setup/new-computer.md`, `docs/ai/memory.md`, `docs/ai/worklog.md` | modified |

### Commands run and results
| Command | Result |
| --- | --- |
| `npm run test:unit` | shared 34 passed, web 7 passed |
| `npm run test:rules` | 3 passed (Firestore + Storage deny-all) |
| `npm run typecheck` | clean (all workspaces + scripts) |
| `npm run build` (web) | first-load JS 119 KB gzipped, CSS 3 KB, fonts 56 KB; Firebase chunk 151 KB (lazy); 13 precache entries |
| `npm run seed` | 3 spaces, 3 events, counter and catalog written to the emulator; read back OK |
| Emulators (auth, firestore, storage, functions, hosting) | all start; `ping` returns `{"ok":true,"featureCount":16}` |
| Headless Chrome on the dev server | dev index shows "Emulator Firebase bersambung"; one anonymous sign-up |
| `npm run deploy:preview` | https://guestcam-2026--preview-s6g4gj5a.web.app (expires 2026-11-03); headers checked with curl; fonts and olive accent checked by screenshot at 390 px |

### Decisions
- D-047 to D-054 recorded in memory.md: shared as TS source with an esbuild functions bundle, demo project for emulators, brand.ts, lazy Firebase, update on navigation, rules-test SDK pins, grpc override, copyright owner.

### Problems, risks, open questions
- **Windows emulator leak:** `firebase emulators:exec`, and stopping `emulators:start`, left the Firestore emulator's `java.exe` running on port 8080, so later starts fail with "port taken". Three leftover emulator processes from this session were still running at the end (PIDs 38136, 3660, 29244/12684). Claude was not permitted to kill them. Close them in Task Manager before running `npm test`.
- **Node 22 vs Firebase JS SDK 13:** the SDK needs Node >= 24.12 when run in Node. The web app is unaffected; rules tests are pinned to SDK 12. Decide on Node 24 before Phase 1.
- `docs/product/spec.md` is still the placeholder; Phase 0 used AGENTS.md, architecture.md, design.md and memory.md.
- `firebase projects:list` showed the resource location as "Not specified"; confirm Firestore and Storage are in asia-southeast1.
- `npm run test:rules` prints a harmless Java NullPointerException from the storage rules runtime at shutdown.
- The first preview deploy attempt failed with a transient API error; the retry succeeded.
- The app icon is a placeholder (camera mark on olive) until the brand is final.

### Next steps
- [ ] Hidayah: close the leftover emulator processes, run `npm test`, open the preview link on a phone, then open a PR from `feat/phase-0-skeleton` to `main`
- [ ] Decide Node 22 vs 24
- [ ] Replace `docs/product/spec.md` with the real spec
- [ ] Ask for the v0.1 release when ready (VERSION bump, tag, release note)
- [ ] Phase 1: entry, name, selfie, Snapshot, Upload from Gallery, queue, privacy step, My Uploads

### Commits
- `3886f0e` chore: set up npm workspaces monorepo root
- `7278dec` feat(shared): add types, paths, entry parser, location, limits and feature catalog
- `5723774` feat(web): scaffold React + Vite app with design tokens and base components
- `5db0ec5` feat(i18n): add i18next with Malay default, English toggle and key parity test
- `434aa07` feat(web): add placeholder routes, config with buildPublicUrl and footer
- `efbf760` feat(firebase): add Firebase config, deny-all rules, functions and rules tests
- `2e4d8f7` feat(storage): add storage adapter interface with Firebase stub
- `8026c23` feat(firebase): connect the web app to the emulators in development
- `1080618` feat(pwa): precache the app shell and apply updates on the next screen change
- `a7f57b3` chore: add dev seed script, env examples and document commands
- (this commit) docs: record Phase 0 in changelog, memory and work log

---

## 2026-10-26 21:40 — Feature toggles, packages and add-ons

- **Agent / model:** Claude (Opus 5.5) in claude.ai chat, planning session with Hidayah
- **Version / branch:** v0.0 + unreleased docs / none yet
- **Phase:** Planning (toggles in v0.5, checkout after v1.0)
- **Goal:** Let the couple or admin choose which functions guests get, with pricing depending on the functions chosen.

### What changed and why
- Two-layer model: entitled (package + add-ons, server-written) AND enabled (host toggle per event). Guests see only effective features; menu reflows.
- Feature catalog of 16 keys in `shared/src/features.ts`; proposed packages Asas / Lengkap / Premium / Custom plus add-ons; prices as data with per-purchase snapshots.
- Enforcement in UI, security rules and functions; 24 h grace for items captured before a feature is switched off; content never deleted on downgrade.
- Folder direct link recorded as a proposed feature (`folderDirectLink`, off by default) pending the founder's decision.

### Files touched
| File | Change |
| --- | --- |
| `docs/architecture/architecture.md` | added Part 6 (catalog, packages, data model, enforcement, pitfalls T1-T5) |
| `AGENTS.md` | rule 17 (feature toggles); shared/ now holds the features catalog |
| `docs/decisions/0006-feature-toggles-and-packages.md`, `docs/decisions/README.md` | added ADR-0006 |
| `docs/ai/memory.md` | D-046; open questions (direct link, package contents and prices) |
| `docs/ai/prompts/phase-0-setup.md` | `features.ts`, catalog types and `isFeatureAvailable` helper in Phase 0 |
| `docs/product/design.md` | menu reflows when tiles are switched off |
| `docs/versions/VERSIONING.md`, `README.md`, `CHANGELOG.md`, `docs/README.md` | roadmap, feature list, Unreleased, index |

### Commands run and results
| Command | Result |
| --- | --- |
| none (documentation only) | |

### Decisions
- D-046 (memory.md, ADR-0006).

### Problems, risks, open questions
- Package contents and prices not final (costing chat).
- Folder direct link awaiting decision.

### Next steps
- [ ] Hidayah: confirm package contents; decide on folder direct link.
- [ ] Continue setup, then Phase 0.

### Commits
- (to be committed by Hidayah: `docs: design feature toggles and packages`)

---

## 2026-10-26 21:30 — Shared folders design (Folder Kongsi)

- **Agent / model:** Claude (Opus 5.5) in claude.ai chat, planning session with Hidayah
- **Version / branch:** v0.0 + unreleased docs / none yet
- **Phase:** Planning (feature targeted for v0.4, Phase 3)
- **Goal:** Let guests create a folder and upload many photos so they no longer need AirDrop, with the folder private to the couple and anyone holding the folder PIN.

### What changed and why
- Designed shared folders: create, auto-generated 6-digit PIN, link + PIN sharing, contributors, ZIP for owners and creator, PIN reset with optional removal, host Folders tab, export keeps folder structure.
- Chose a subcollection per folder (`events/{e}/folders/{f}/media`) so privacy is enforced by path and gallery queries can never include folder items.
- Added brute-force protection (three rate limits, lockout, App Check) and re-pick deduplication for large batches.
- Menu grows to eight tiles (Shared Folder added).

### Files touched
| File | Change |
| --- | --- |
| `docs/architecture/architecture.md` | added Part 5: behaviour, data model, functions, rules, pitfalls F1-F6 |
| `AGENTS.md` | folder route; rule 15 extended; new rule 16 (folder privacy) |
| `docs/decisions/0005-shared-folders-with-pin.md`, `docs/decisions/README.md` | added ADR-0005 |
| `docs/ai/memory.md` | D-045 added; D-007 superseded (S-11); open question; glossary |
| `docs/product/design.md` | menu now seven tiles + Galeri; folder icon to custom-draw |
| `docs/versions/VERSIONING.md` | v0.4 roadmap includes shared folders |
| `docs/ai/prompts/phase-0-setup.md` | `Folder`, `FolderMember` types in Phase 0 |
| `README.md`, `CHANGELOG.md` | feature listed; `[Unreleased]` entry |

### Commands run and results
| Command | Result |
| --- | --- |
| none (documentation only) | |

### Decisions
- D-045: shared folders (see memory.md and ADR-0005).

### Problems, risks, open questions
- Firestore list queries plus `exists()` checks on member docs must be covered by rules tests before release.
- Open: ZIP download for non-creator PIN holders (v1: no); moving folder items to the public gallery (v1: no).

### Next steps
- [ ] Hidayah: continue `docs/setup/start-here.md`, then Phase 0.

### Commits
- (to be committed by Hidayah: `docs: design shared folders (Folder Kongsi)`)

---

## 2026-10-25 03:15 — Planning baseline and repo structure (v0.0)

- **Agent / model:** Claude (Opus 5.5) in claude.ai chat, planning session with Hidayah
- **Version / branch:** v0.0 / none yet (repo not created)
- **Phase:** Planning
- **Goal:** Plan the guest camera web app end to end and prepare a documented repo starter before writing code.

### What changed and why
- Defined the product (features, flows, privacy, metadata, multi-event spaces) and recorded it in the planning doc (exported to `docs/product/spec.md`).
- Researched commercial competitors (POV, Once, Lense, GuestPix, Wedibox, and others) and Firebase, Supabase and Cloudflare R2 pricing; produced a cost estimate for 1,000 guests.
- Chose the stack (React + Vite + TypeScript PWA, Firebase in asia-southeast1, conda environment) and wrote the AI rules (`AGENTS.md`).
- Reviewed the design for bugs before coding and wrote 40 known pitfalls with fixes (`docs/architecture/architecture.md`). Several fixed real design flaws: location leakage through Firestore rules, guest-name leakage, unparseable route, duplicate uploads.
- Set up versioning (`A.B`), changelog, release note template, ADRs, AI memory and this work log so any AI can resume.

### Files touched
| File | Change |
| --- | --- |
| `README.md`, `AGENTS.md`, `CLAUDE.md`, `VERSION`, `CHANGELOG.md`, `LICENSE`, `.gitignore` | added |
| `environment.yml` | added: conda env (Node 22, Java 21, ffmpeg, git, gh, Python, locust) |
| `docs/**` | added: product, architecture, decisions, versions, ai, setup |

### Commands run and results
| Command | Result |
| --- | --- |
| Colour contrast checks (Python) | All text pairs pass WCAG AA; brass decorative only |

### Decisions
- D-001 to D-044 and superseded S-01 to S-10 recorded in `docs/ai/memory.md`; ADR-0001 to ADR-0004 in `docs/decisions/`.

### Problems, risks, open questions
- Product name not final (working name Kenang; codename guestcam).
- Copyright owner line for the footer not decided.
- `docs/product/spec.md` must be exported by hand from the planning doc.

### Next steps
- [ ] Hidayah: finish `docs/setup/start-here.md` (accounts, conda env, Firebase project, GitHub repo).
- [ ] Run Phase 0 with `docs/ai/prompts/phase-0-setup.md`.

### Commits
- (first commit to be made by Hidayah: `docs: add project documentation baseline`)
