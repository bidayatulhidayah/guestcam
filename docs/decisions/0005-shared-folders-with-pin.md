# ADR-0005: Shared folders protected by PIN

- **Status:** Accepted
- **Date:** 2026-10-26
- **Deciders:** Hidayah
- **Related:** memory D-045, ADR-0004; architecture.md Part 5

## Context

After an event, guests usually send photos to the couple by AirDrop (iPhone only, needs to be nearby) or WhatsApp (compresses photos and strips metadata). Some guests have hundreds of photos, for example from a relative's camera. The founder wants guests to create a folder, upload everything in original quality, and have the couple receive it automatically. The folder must be private: only the couple and people with the folder's PIN may see it.

## Options considered

| Option | Pros | Cons |
| --- | --- | --- |
| Upload as normal private items | No new feature | No grouping; friends in the same group cannot see each other's photos |
| Folder visible to all event guests | Simple | Not private; founder requires privacy |
| Folder link only (secret URL) | One step | Anyone who sees the link gets in; forwarding cannot be undone |
| **Folder link + 6-digit PIN checked on the server, membership by path** | Private; PIN can be reset; easy for all ages; rules enforce privacy | PIN can be forwarded with the link; needs brute-force protection |

## Decision

- Any event member can create a folder. The server generates a 6-digit PIN.
- Access: space owners, the creator, and members who joined with the current PIN (`pinVersion`). Moderators and other guests are excluded. A folder PIN never opens the event.
- PIN holders can view, download single items and add files. Owners and the creator can download a ZIP, reset the PIN (optionally removing old members) and delete the folder.
- Folder media live in a subcollection under the folder, so security is enforced by path and no gallery query can include them.
- `joinFolder` checks the PIN with rate limits per device, per IP and per folder, then locks the PIN and notifies the creator and owners.

## Consequences

- Good: replaces AirDrop and WhatsApp with full-quality, metadata-preserving, organised sharing; the couple sees every folder automatically.
- Bad: a 6-digit PIN is guessable without rate limits, so the limits and App Check are mandatory; ZIP downloads cost bandwidth.
- Follow-up: rules tests listed in architecture.md Part 5; per-folder fingerprints so re-picking uploads only new files.
