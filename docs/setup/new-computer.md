# Setup checklist (new computer)

Everything the project needs is defined in files inside the repo, so a new computer only needs these steps.

## Where the "requirements" live

| File | What it pins |
| --- | --- |
| `environment.yml` | System tools: Node.js 24, Java 21, ffmpeg, Git, Python |
| `package.json` + `package-lock.json` (repo root) | All libraries for every workspace (`shared`, `web`, `functions`, `rules-tests`); ONE lock file |
| `web/.env.example` | Web settings (Firebase web config, public address, footer owner); copy to `web/.env.local` |
| `functions/.env.example` | Function parameters (`PUBLIC_BASE_URL`); copy to `functions/.env.local` |

`package-lock.json` is the Node.js equivalent of a pinned `requirements.txt`. Always commit it. The project uses npm workspaces, so there is only one, at the repo root.

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
- [ ] Copy settings: `cp web/.env.example web/.env.local` and fill in the Firebase config (`firebase apps:sdkconfig web` prints it)
- [ ] Install project libraries (all workspaces at once, from the repo root): `npm ci`
- [ ] Check: `npm test` passes (needs Java from the conda env for the emulators)

## Every work session

- [ ] `conda activate guestcam`
- [ ] `git pull`
- [ ] If `environment.yml` changed: `conda env update -f environment.yml --prune`
- [ ] If `package-lock.json` changed: `npm ci` at the repo root
- [ ] Start emulators: `npm run emulators` (first time: `npm run seed` in a second terminal)
- [ ] Start the app: `npm run dev`

## Before switching computers

- [ ] Commit and push all work (`git status` should be clean)
- [ ] Never commit `.env.local` or service-account keys; store them in a password manager

## Notes

- Always run commands inside `conda activate guestcam`: it provides Node 24 and Java 21. Every package.json requires Node 24 (`engines`), and Cloud Functions run on `nodejs24`. A different global Node (for example v22 or v25) is not supported.
- Moving an existing computer from Node 22 to 24: `conda env update -f environment.yml --prune`, check `node -v` shows v24, then `npm install -g firebase-tools` again (global tools live inside the env) and `npm ci` at the repo root.
- On Windows, stopping the emulators with Ctrl+C sometimes leaves a `java.exe` behind holding port 8080. If the next start says "port taken", close it in Task Manager.

- `npm install -g` inside an active conda env installs into that env, not the whole computer, so Firebase CLI stays with the project.
- Use `npm ci` (not `npm install`) on a new computer: it installs exactly what the lock file says.
- If you add a new system tool, add it to `environment.yml` and commit, so the next computer gets it too.
