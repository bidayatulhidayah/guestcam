# Versioning policy

This project uses a two-part version number, **`A.B`**, with git tags, a changelog and one detailed release note per version.

## The number

| Part | Name | Bump when | Example |
| --- | --- | --- | --- |
| `A` | Major | A milestone that changes what the product is or breaks compatibility: data model migrations, URL format changes, security model changes, first real event, public launch | `0.9` → `1.0` |
| `B` | Minor | Any release within the same major: new features, improvements, bug fixes | `1.3` → `1.4` |

- `0.x` = before the first real event. Anything can change.
- `1.0` = first release used at a real event (planned: the friend's engagement).
- `2.0` = first business release (planned: multi-couple, paid), or any later breaking change.
- Bug fixes do not get their own number; they ship in the next minor. An urgent fix during an event is released immediately as the next minor (e.g. `1.4` → `1.5`).
- After `A` goes up, `B` resets to 0.
- Version numbers are never reused, even if a release is withdrawn.

### Where the number lives

| Place | Format | Example |
| --- | --- | --- |
| `VERSION` (source of truth) | `A.B` | `0.1` |
| Git tag | `vA.B` | `v0.1` |
| `package.json` (all workspaces) | `A.B.0` (npm requires three numbers) | `0.1.0` |
| App footer and bug reports | `vA.B` + short commit hash | `v0.1 (a1b2c3d)` |

## Planned roadmap

| Version | Content |
| --- | --- |
| 0.0 | Project documentation baseline (this starter) |
| 0.1 | Phase 0: skeleton, tooling, design tokens, routes, tests |
| 0.2 | Phase 1: entry, name, selfie, Snapshot, Upload from Gallery, queue, privacy step, My Uploads |
| 0.3 | Phase 2: Type a Wish, Call the Couple, Video Wish |
| 0.4 | Phase 3: gallery, processing, boomerang, decoration, shared folders |
| 0.5 | Phase 4: admin, spaces, aliases, export, feature toggles per event |
| 0.6 | Phase 5: hardening, load test, device matrix |
| 1.0 | Release used at the friend's engagement |
| 1.x | Fixes and polish for the founder's wedding |

The roadmap can change; record changes in `docs/ai/memory.md`.

## Commit messages (Conventional Commits)

```
<type>(<optional scope>): <short summary in English, imperative>

<optional body: what and why>
```

| Type | Use for |
| --- | --- |
| `feat` | New feature for guests or hosts |
| `fix` | Bug fix |
| `perf` | Performance improvement |
| `security` | Security or privacy fix |
| `refactor` | Code change with no behaviour change |
| `test` | Tests only |
| `docs` | Documentation only |
| `chore` | Tooling, dependencies, config |

Examples: `feat(queue): resume uploads after reload`, `fix(call): stop recording when screen locks`, `docs(memory): record alias booking decision`.

## Branches

- `main`: always deployable. Protected: changes arrive by pull request.
- `feat/<short-name>`, `fix/<short-name>`, `docs/<short-name>`: one topic per branch.
- Merge with "Squash and merge" so each pull request becomes one clean Conventional Commit on `main`.

## Changelog

`CHANGELOG.md` follows the Keep a Changelog format:

- Newest version first; an `## [Unreleased]` section at the top collects changes as they land.
- Sections per version: `Added`, `Changed`, `Fixed`, `Removed`, `Security`, `Deprecated` (only those that apply).
- Written for humans (hosts and the founder), not as a copy of commit messages.

## Release notes (this folder)

Each version gets `docs/versions/vA.B.md` with more detail than the changelog: goals, what shipped, screenshots or links, migrations, known issues, test results, device matrix, rollback notes. Use `_template.md`.

## Release steps

Only when the human asks for a release:

1. All tests pass; emulator smoke test done; preview deploy checked on a real iPhone and Android.
2. Move `[Unreleased]` items in `CHANGELOG.md` under the new version heading with today's date.
3. Write `docs/versions/vA.B.md` from the template.
4. Update `VERSION` and every `package.json` version (`A.B.0`).
5. Add a work log entry and update `docs/ai/memory.md` (status, version).
6. Commit: `chore(release): vA.B`.
7. Tag: `git tag -a vA.B -m "vA.B"` then `git push && git push --tags`.
8. Create a GitHub Release from the tag, pasting the changelog section.
9. Deploy (production deploy only when the human says so).

## Rollback

Every release is a tag, so a bad release is rolled back by redeploying the previous tag. Data migrations must say in their release note whether they can be reversed.
