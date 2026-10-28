# Roadmap

This is a working roadmap based on the prototype and the team's workbook/process description as of 2026-10-23. It is not a committed delivery schedule. See [WORKFLOWS.md](WORKFLOWS.md) for the process model and questions to resolve.

## Current checkpoint

Supabase Auth, task persistence, and Realtime scaffolding are in place. The Catalog supports Editor management of Makes, Models, Segments, Authors, and Model Years; each Make/Model/Year record carries its Segment. The next work is to import and reconcile the workbook's master data, then validate Publication Tracking against real shared records before building Changeover and Page Audit.

## 1. Confirm the work

- Confirm handoffs and exact status meanings, including updates and audit follow-up.
- Decide how Changeover entries become publication-tracking work and how audits attach to published pages.
- Identify the authoritative source and migration plan for each current workbook dataset.
- Agree on first-release scope, measurable speed/usability target, and rollout plan.

## 2. Define the first usable workflow

- Build a continuously updated Publication Tracking view with search, filters, sorting, and pagination that stays quick on the full dataset.
- Build year-specific Changeover and Page Audit views over agreed model-year vehicle/page records; decide whether these are separate views over one record or linked records.
- [x] Add editable Makes, Models, Segments, and Authors sources, including author teams (BG, C/D, FL) and make/model/year-to-segment mapping.
- Support task creation from controlled make/model/author options and automatically fill the segment from the selected model.
- Add drag-and-drop to reorder or move work where the agreed workflow benefits from it, with explicit status/permission rules.
- Preserve updates as records associated with a published MMP, without sending them through the new-page workflow.
- Define how ownership, audit history, and concurrent changes are recorded.

## 3. Establish reliable data and access

- [x] Choose Supabase as the shared database.
- [x] Add durable task/catalog persistence and live updates for shared records.
- [x] Add Editor/Viewer authentication and role-based access.
- Decide conflict handling and audit history.
- Plan safe import, migration, reconciliation, and backup of existing records.

## 4. Prepare for daily use

- Validate the interface with the people doing the work.
- Set responsive, accessibility, and browser requirements.
- Add verification for critical lifecycle transitions and data changes.
- Plan deployment, support, and ownership.

## Performance and collaboration acceptance

- Multiple users see committed edits promptly without manually refreshing.
- Common views, filters, and searches stay responsive at expected data volume.
- Paginated results do not load all historical records into the browser.
- Simultaneous edits have an agreed, visible outcome; users do not silently overwrite each other's work.

## Current prototype boundary

The repository implements a Vue 3 dashboard, Supabase-backed task/catalog flows, and Editor/Viewer authentication. It is not yet a complete end-to-end process: workbook import, larger-scale Publication Tracking performance, Changeover, and Page Audit remain. See [TECH_HANDOFF.md](TECH_HANDOFF.md) for implementation details.
