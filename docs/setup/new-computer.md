# Setup checklist (new computer)

Everything the project needs is defined in files inside the repo, so a new computer only needs these steps.

## Where the "requirements" live

| File | What it pins |
| --- | --- |
| `environment.yml` | System tools: Node.js 24, Java 21, ffmpeg, Git, Python |
| Google Cloud CLI (outside conda) | `gcloud`, only for admin scripts against the real project (`npm run seed:project`). conda-forge has no Windows build, so it is installed with Google's Windows installer and is NOT in `environment.yml` |
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
- [ ] Only if you will run admin scripts against the real project: install the Google Cloud CLI (non-conda tool, see Notes) and run `gcloud auth application-default login`, then `gcloud auth application-default set-quota-project guestcam-2026`

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
- On Windows, the emulators often leave `java.exe` (Firestore, Storage rules) or `node.exe` running after they stop, holding their ports, so the next run fails with "port taken". Fix: `npm run emulators:kill`. It frees ports 4000, 4400, 4500, 5001, 8080, 8085, 9099 and 9199, but only stops processes that are Firebase emulators; any other app on those ports is reported and left running. `npm run emulators:kill -- -DryRun` shows what it would stop. It does nothing on macOS or Linux.
- `npm test` runs `emulators:kill` automatically before and after the tests (`pretest` / `posttest`). If a test fails, npm skips `posttest`, but the next `npm test` cleans up first. After stopping `npm run emulators` with Ctrl+C, run `npm run emulators:kill` yourself.

- `npm install -g` inside an active conda env installs into that env, not the whole computer, so Firebase CLI stays with the project.
- Use `npm ci` (not `npm install`) on a new computer: it installs exactly what the lock file says.
- If you add a new system tool, add it to `environment.yml` and commit, so the next computer gets it too.
- Function settings per project live in `functions/.env.<project-id>` (not committed), e.g. `functions/.env.guestcam-2026` with `PUBLIC_BASE_URL=https://guestcam-2026.web.app`. Copy `functions/.env.example`. Without it, deploys use an empty address.
- `npm run seed:project` writes to the real project with the Firebase Admin SDK, which needs Google Application Default Credentials (the Firebase CLI login is not enough). One-time setup per computer, no key file:
  1. Install the Google Cloud CLI with Google's Windows installer (https://cloud.google.com/sdk/docs/install). It is a **non-conda tool**: conda-forge has no Windows build, so do not add `google-cloud-sdk` to `environment.yml`. The installer puts `gcloud` on the system PATH, so it works inside and outside the conda env.
  2. Open a new terminal and run `gcloud auth application-default login`; sign in with the Google account that owns the Firebase project.
  3. Run `gcloud auth application-default set-quota-project guestcam-2026`.
  4. Then: `npm run seed:project -- --project guestcam-2026`. It only creates test space #00100 and its test event, never overwrites, and stops if #00100 already exists. The event code is printed to the terminal only; never paste it into docs, commits or chats.
  Never create or commit a service-account key file.
