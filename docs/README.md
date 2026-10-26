# Documentation index

| Folder | What is inside | Update when |
| --- | --- | --- |
| [product/](product/) | `spec.md` (features, flows, data model, costs, market study), `design.md` (visual direction, tokens, banned list) | Product or design decisions change |
| [architecture/](architecture/) | `architecture.md`: code structure, 40 known pitfalls with fixes, multi-event spaces, domain independence, plans, demo and trials (Part 4), shared folders (Part 5), feature toggles and packages (Part 6) | Structure, data model or routing changes |
| [decisions/](decisions/) | Architecture Decision Records (ADRs) | A significant, hard-to-reverse decision is made |
| [versions/](versions/) | `VERSIONING.md` (policy), `_template.md`, one release note per version | Every release |
| [ai/](ai/) | `memory.md` (project context + decision log), `worklog.md` (per-session log), `prompts/` (phase prompts) | Every AI session (mandatory, see AGENTS.md) |
| [setup/](setup/) | `start-here.md` (first-time checklist), `new-computer.md` (moving to another machine) | Tools or setup steps change |

Reading order for someone new: `ai/memory.md` → `../AGENTS.md` → `product/spec.md` → `architecture/architecture.md`.
