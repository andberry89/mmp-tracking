# Roadmap

This is a working roadmap based on the prototype and the team's workbook/process description as of 2026-10-23. It is not a committed delivery schedule. See [WORKFLOWS.md](WORKFLOWS.md) for the process model and questions to resolve.

## 1. Confirm the work

- Confirm handoffs and exact status meanings, including updates and audit follow-up.
- Decide how Changeover entries become publication-tracking work and how audits attach to published pages.
- Identify the authoritative source and migration plan for each current workbook dataset.
- Agree on first-release scope, measurable speed/usability target, and rollout plan.

## 2. Define the first usable workflow

- Build a continuously updated Publication Tracking view with search, filters, sorting, and pagination that stays quick on the full dataset.
- Build year-specific Changeover and Page Audit views over agreed model-year vehicle/page records; decide whether these are separate views over one record or linked records.
- Add editable Makes, Models, Segments, and Authors sources, including author teams (BG, C/D, FL) and make/model-to-segment mapping.
- Support task creation from controlled make/model/author options and automatically fill the segment from the selected model.
- Add drag-and-drop to reorder or move work where the agreed workflow benefits from it, with explicit status/permission rules.
- Preserve updates as records associated with a published MMP, without sending them through the new-page workflow.
- Define how ownership, audit history, and concurrent changes are recorded.

## 3. Establish reliable data and access

- Choose between a Microsoft-backed solution and a standalone shared database after IT, identity, hosting, and integration constraints are known.
- Replace sample-only loading with durable multi-user persistence and live updates.
- Decide authentication, roles, conflict handling, and audit history.
- Add user authentication with role-based view-only and edit access.
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

The repository currently implements a Vue 3 dashboard shell and a sample-data MMP task workflow. It does not yet establish a production backend, authentication, or a complete end-to-end process. The spreadsheet provides current operational detail and historical records. See [TECH_HANDOFF.md](TECH_HANDOFF.md) for details.
