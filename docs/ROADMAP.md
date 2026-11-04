# Roadmap

This is a working roadmap, not a committed delivery schedule. The ordered, current task list lives in [TODO.md](TODO.md); see [WORKFLOWS.md](WORKFLOWS.md) for the process model.

## Current checkpoint

Supabase Auth, task persistence, and Realtime scaffolding are in place. The Catalog supports Editor management of Makes, Models, Segments, Authors, and Model Years. Publication Tracking, Changeover, and Page Audit use shared vehicle-year records. Annual Changeover preparation and draft management are implemented. Publication Tracking supports drag-to-change-status and 25-item Published & Updated pagination. Editor/Viewer access, user management, account settings, and the server-side invitation function are implemented; the invitation flow still needs a release check. The basic security review is complete, and the current responsive/accessibility pass has been accepted. The project will use Supabase's default Auth email templates unless a custom SMTP provider becomes available.

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
- [ ] Replace full task-list reloads on Realtime events with appropriately scoped updates or refetches.
- [x] Complete a basic security review of Supabase Auth, Row Level Security, Edge Functions, app data exposure, spam/abuse controls, and secret handling. Remaining production configuration is tracked in [TODO.md](TODO.md).
- [ ] Develop an automated test suite for critical lifecycle transitions, access control, and data changes.
- Plan deployment, support, and ownership.

## Additional interface ideas (timing TBD)

- Add temporary MMP event tags for grouping work around events such as the New York Auto Show or Pebble Beach; clear a task's tag when it is published.
- Add Editor profile pictures with upload size/type restrictions and an image-cropping step.

## Next product area

- Build Rankings for 2027 first, with a year selector, body-style filters, search, multi-segment comparison, and drag-and-drop ranking within each segment.
- Support multiple segment assignments per model year, with independent rankings per segment placement.
- Share vehicle ratings and award history across Catalog, Rankings, and Page Audit.
- Keep implementation order and remaining launch requirements in [TODO.md](TODO.md).

## Performance and collaboration acceptance

- Multiple users see committed edits promptly without manually refreshing.
- Common views, filters, and searches stay responsive at expected data volume.
- Paginated results do not load all historical records into the browser.
- Simultaneous edits have an agreed, visible outcome; users do not silently overwrite each other's work.

## Current prototype boundary

The repository implements a Vue 3 dashboard, Supabase-backed task/catalog flows, Editor/Viewer authentication, Changeover, and Page Audit. The 2026–2029 Page Audit workbook import succeeded, and annual Changeover preparation is available. Field-specific audit completion rules remain. See [TECH_HANDOFF.md](TECH_HANDOFF.md) for implementation details.
