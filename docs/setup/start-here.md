# Start here — guestcam

Work top to bottom. Tick each box before moving on.

## 1. Accounts (once)

- [ ] GitHub account; create a **private** repo named `guestcam` (leave "Add a README" unticked so it starts empty)
- [ ] Google account for Firebase
- [ ] Claude account with Claude Code access

## 2. Install on your computer (once per computer)

- [ ] Miniconda
- [ ] VS Code
- [ ] Claude Code (follow the official install guide at docs.claude.com), then sign in

## 3. Environment

- [ ] Unzip the `guestcam` starter somewhere temporary (e.g. Downloads) and open **Anaconda Prompt** in that folder
- [ ] `conda env create -f environment.yml`
- [ ] `conda activate guestcam`
- [ ] Check: `node -v` shows v22, `java -version` shows 21, `ffmpeg -version` and `gh --version` work
- [ ] `npm install -g firebase-tools`
- [ ] `firebase login`
- [ ] `gh auth login` (choose GitHub.com → HTTPS → log in with browser)

## 4. Create the repo folder

- [ ] Clone the empty repo: `gh repo clone <your-username>/guestcam` then `cd guestcam`
- [ ] Unzip the `guestcam` starter into the cloned folder, so `README.md`, `AGENTS.md`, `docs/` etc. sit at the repo root

- [ ] Replace `docs/product/spec.md`: open the "Wedding Guest Camera — Project Spec" doc, download/export as Markdown, rename to `spec.md`
- [ ] First commit: `git add . && git commit -m "docs: add project documentation baseline" && git push`
- [ ] Tag the baseline: `git tag -a v0.0 -m "v0.0" && git push --tags`

## 5. Firebase project (in the browser)

- [ ] console.firebase.google.com → Add project → name `guestcam` (Google Analytics: off is fine)
- [ ] Upgrade to **Blaze** plan
- [ ] Billing → Budgets & alerts → budget with alerts at **RM 100, 200, 400**
- [ ] Create **Firestore** in region `asia-southeast1` (Singapore), production mode
- [ ] Create **Storage** in the same region
- [ ] Authentication → enable **Anonymous** and **Email/Password**
- [ ] Add a **Web app** in project settings; keep the config values for `.env.local` later

## 6. Phase 0 with Claude Code

- [ ] In the repo folder with the env active, run `claude`
- [ ] Paste the prompt from `docs/ai/prompts/phase-0-setup.md`
- [ ] Read Claude's plan; approve or ask for changes
- [ ] After each step: try the verification it gives you; only then let it commit

## 7. Phase 0 is done when

- [ ] `npm test` passes (entry parser, i18n keys, rules deny-all)
- [ ] `firebase emulators:start` runs without errors
- [ ] `npm run dev` shows the placeholder pages in BM
- [ ] A preview link opens on your phone with the olive accent and the right fonts
- [ ] Everything is committed and pushed

Then come back for the Phase 1 prompt: name, selfie, Snapshot, upload queue, privacy step.

## Daily habit

- [ ] `conda activate guestcam` → `git pull` → work → test → commit → push
- [ ] Never commit `.env.local` or keys
