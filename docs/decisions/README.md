# Architecture Decision Records (ADRs)

An ADR records one significant decision: the context, the options considered, what was chosen and the consequences. They explain *why* the system is the way it is, long after the conversation that produced it.

- Write an ADR for decisions about the data model, security and privacy, hosting and vendors, addressing/URLs, or anything expensive to reverse.
- Smaller decisions only need a line in `docs/ai/memory.md`.
- Number sequentially: `NNNN-short-title.md`. Never renumber or delete.
- To change a decision, write a new ADR and set the old one's status to `Superseded by ADR-NNNN`.
- Copy `_template.md` to start.

| ADR | Title | Status |
| --- | --- | --- |
| [0001](0001-record-architecture-decisions.md) | Record architecture decisions | Accepted |
| [0002](0002-firebase-with-storage-adapter.md) | Firebase as the platform, behind a storage adapter | Accepted |
| [0003](0003-spaces-permanent-ids-and-aliases.md) | Spaces, permanent IDs and time-limited aliases | Accepted |
| [0004](0004-membership-based-event-access.md) | Membership-based event access and privacy | Accepted |
| [0005](0005-shared-folders-with-pin.md) | Shared folders protected by PIN | Accepted |
| [0006](0006-feature-toggles-and-packages.md) | Feature toggles, packages and add-ons | Accepted |
