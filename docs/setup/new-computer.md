# Setup checklist (new computer)

Everything the project needs is defined in files inside the repo, so a new computer only needs these steps.

## Where the "requirements" live

| File | What it pins |
| --- | --- |
| `environment.yml` | System tools: Node.js, Java, ffmpeg, Git, Python |
| `web/package.json` + `web/package-lock.json` | Front-end libraries (React, Vite, Firebase SDK, i18next, Dexie...) |
| `functions/package.json` + `functions/package-lock.json` | Cloud Functions libraries (sharp, ffmpeg wrapper...) |
| `.env.example` | Names of the settings you need; copy to `.env.local` and fill in |

`package-lock.json` is the Node.js equivalent of a pinned `requirements.txt`. Always commit it.

## One-time on each computer

- [ ] Install Miniconda (or Anaconda)
- [ ] Install VS Code
- [ ] Get `environment.yml` (download it from the repo on github.com), then create the environment: `conda env create -f environment.yml`
- [ ] Activate it: `conda activate guestcam`
- [ ] Sign in to GitHub: `gh auth login` (GitHub.com → HTTPS → browser)
- [ ] Clone the repo: `gh repo clone <your-username>/guestcam` then `cd guestcam`
- [ ] Install Firebase CLI inside the env: `npm install -g firebase-tools`
- [ ] Log in: `firebase login`
- [ ] Install and sign in to Claude Code (official instructions at docs.claude.com)
- [ ] Copy settings: `cp web/.env.example web/.env.local` and fill in the Firebase config
- [ ] Install project libraries: `cd web && npm ci`, then `cd ../functions && npm ci`

## Every work session

- [ ] `conda activate guestcam`
- [ ] `git pull`
- [ ] If `environment.yml` changed: `conda env update -f environment.yml --prune`
- [ ] If a `package-lock.json` changed: `npm ci` in that folder
- [ ] Start emulators: `firebase emulators:start`
- [ ] Start the app: `cd web && npm run dev`

## Before switching computers

- [ ] Commit and push all work (`git status` should be clean)
- [ ] Never commit `.env.local` or service-account keys; store them in a password manager

## Notes

- `npm install -g` inside an active conda env installs into that env, not the whole computer, so Firebase CLI stays with the project.
- Use `npm ci` (not `npm install`) on a new computer: it installs exactly what the lock file says.
- If you add a new system tool, add it to `environment.yml` and commit, so the next computer gets it too.
