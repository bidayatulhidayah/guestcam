# ADR-0002: Firebase as the platform, behind a storage adapter

- **Status:** Accepted
- **Date:** 2026-10-25
- **Deciders:** Hidayah
- **Related:** memory D-022, D-023, D-024

## Context

The app needs guest auth without accounts, a real-time gallery, resumable uploads of large files, background media processing and hosting, built by one developer who is learning. For one medium event (about 300 GB stored, 410 GB downloaded) the estimates were roughly: Firebase only US$60-70, Supabase Pro US$55-65 in the event month, Firebase + Cloudflare R2 for files US$20-30. Downloads (egress, about $0.12/GB on Firebase) dominate the bill.

## Options considered

| Option | Pros | Cons |
| --- | --- | --- |
| Firebase only | One integrated platform; real-time Firestore; resumable uploads; security rules; easiest to learn | Expensive downloads at business scale |
| Supabase | Postgres; 250 GB egress included in Pro | Fixed monthly fee; less turnkey offline/real-time |
| Firebase + Cloudflare R2 for files | Free egress; cheapest at scale | Signed multipart uploads and permission checks to build |
| Own server (VPS) | Lowest raw cost | On-call on someone's wedding day |

## Decision

Use Firebase (Blaze, asia-southeast1) for everything in v1. All file access goes through a storage adapter (`uploadFile`, `getDisplayUrl`, `getThumbUrl`, `getDownloadUrl`, `deleteFile`) so files can move to Cloudflare R2 for the business stage without changing screens.

## Consequences

- Good: fastest path to a reliable v1; one system to learn.
- Bad: Firebase resumable uploads do not survive a page reload (restart from zero); large-video processing needs a Cloud Run job.
- Follow-up: implement the R2 adapter before going commercial; budget alerts at RM 100 / 200 / 400 from day one.
