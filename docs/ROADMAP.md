# Roadmap

This is a working roadmap based on the prototype and the team's workbook/process description as of 2026-10-23. It is not a committed delivery schedule. See [WORKFLOWS.md](WORKFLOWS.md) for the process model and questions to resolve.

## Current checkpoint

Supabase Auth, task persistence, and Realtime scaffolding are in place. The Catalog supports Editor management of Makes, Models, Segments, Authors, and Model Years; each Make/Model/Year record carries its Segment. Publication Tracking, Changeover, and Page Audit use shared vehicle-year records. Annual Changeover preparation and draft management are implemented. The Editor user-access panel, Account Settings, optional Author links, and server-side invitation function are built; migrations and function deployment are pending.

## 1. Confirm the work

- Confirm handoffs and exact status meanings, including updates and audit follow-up.
- Decide how Changeover entries become publication-tracking work and how audits attach to published pages.
- Identify the authoritative source and migration plan for each current workbook dataset.
- Agree on first-release scope, measurable speed/usability target, and rollout plan.

## 2. Define the first usable workflow

- Build a continuously updated Publication Tracking view with search, filters, sorting, and pagination that stays quick on the full dataset.
- [x] Build a year-specific Changeover list over shared model-year vehicle records, with status, author, notes, URL, filtering, counts, and editable deadlines.
- Review the first Page Audit workflow with the team, then add conditional checklist behavior, evidence, and repeat-audit history as needed.
- [x] Build the annual Changeover preparation flow over shared model-year vehicle/page records, with explicit Editor promotion.
- [x] Add editable Makes, Models, Segments, and Authors sources, including author teams (BG, C/D, FL) and make/model/year-to-segment mapping.
- Support task creation from controlled make/model/author options and automatically fill the segment from the selected model.
- Add drag-and-drop to reorder or move work where the agreed workflow benefits from it, with explicit status/permission rules.
- Preserve updates as records associated with a published MMP, without sending them through the new-page workflow.
- Define how ownership, audit history, and concurrent changes are recorded.

## 3. Establish reliable data and access

- [x] Choose Supabase as the shared database.
- [x] Add durable task/catalog persistence and live updates for shared records.
- [x] Add Editor/Viewer authentication and role-based access.
- [x] Build Editor-managed email allowlisting and role assignment; apply the user-access migration before using the panel.
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

The repository implements a Vue 3 dashboard, Supabase-backed task/catalog flows, Editor/Viewer authentication, Changeover, and Page Audit. The 2026–2029 Page Audit workbook import succeeded, and annual Changeover preparation is available. Field-specific audit completion rules remain. See [TECH_HANDOFF.md](TECH_HANDOFF.md) for implementation details.
