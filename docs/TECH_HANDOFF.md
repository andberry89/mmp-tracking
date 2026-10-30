# Technical Handoff and Preferences

## Repository snapshot

- Application: `mmp-tracking`, a Vue 3 + TypeScript single-page application.
- Build tooling: Vite; package manager lockfile: `package-lock.json` (npm).
- State: Pinia stores for documents and authors.
- Styling: Tailwind CSS utilities plus CSS custom properties and component styles.
- UI libraries include Floating Vue, Vue Final Modal, and Vue3 Popper.
- Main entry: `src/main.ts`; app shell: `src/App.vue`.
- Core task data types: `src/types/TaskDocument.ts`, `TaskVehicle.ts`, and `TaskAsset.ts`.
- Sample records under `src/test/` are used in demo mode; when configured, Supabase is the source of truth for task and catalog data.

## Current behavior and limitations

- The dashboard has top-level MMPs, Changeover, and Catalog navigation; Catalog contains Makes, Models, Segments, and Authors views.
- The MMP view has task cards with edit, duplicate, delete, author assignment, and asset management interactions.
- Editors can manage Makes, Models, Segments, Authors, and Model Years in the Catalog. Models reference a Make; each Model Year vehicle record carries its own Segment. Task creation uses active catalog entries and fills Segment from the selected Make/Model/Year. Catalog table changes are broadcast through Supabase Realtime.
- Supabase Auth gates the app and exposes Editor/Viewer roles. The app loads and persists task, author, and catalog data through Supabase; demo mode uses sample records when local Supabase settings are absent.
- The task model includes author, vehicle, deadline, status, notes, assets, embargo, and publication fields.
- Changeover has a year selector, vehicle/status/author filters, status summaries, an editable per-year deadline with pacing, and Editor add/edit over shared model-year vehicle records. New entries use the Catalog's Make/Model/year options; public URLs remain stored once on the shared vehicle-year record. Changeover no longer displays the imported Review flag.
- Page Audit has a year selector, source-status/search filters, a horizontally scrollable table showing all included checklist fields, author/auditor/date, Audit Notes, and the Double-check info flag. Workbook Yes flags from the 2026 and 2027 Changeover sheets are seeded into the corresponding Page Audit years. Checklist cells are color-coded by expected answer; the third column summarizes pass, review, and needs-work counts. 10 Best and Editors' Choice are separate award fields in one Awards column and do not count toward checklist scoring; the supplied SVG icons appear when their corresponding value is Yes. A published-page URL may be shown read-only from the shared vehicle-year record; unpublished pages have no URL, and Page Audit does not store resource or editor links. A seed imports 2026–2029 rows idempotently.
- The 2026–2029 Page Audit import succeeded with 918 catalog matches and no unmatched vehicles. A follow-up migration removes the app-invented audit progress field; the annual Prepare Next Model Year/reconciliation workflow is not implemented yet.
- `supabase/seeds/changeover.sql` imports the workbook's 2024–2027 Changeover lists and deadlines. It inserted all 1,988 source rows with no unmatched Catalog vehicles; 169 entries are flagged for review, including 128 with unresolved source-author values. It filled 1,766 shared public URLs and set four deadlines. Existing Changeover rows and nonblank URLs are preserved on reruns.
- The Publication Tracking view still needs server-side search/filtering and pagination for larger history volumes.
- No repository-level `AGENTS.md` or project-specific handoff instructions were found at the time of inspection.

## User-provided workflow and workbook

The team currently uses a shared Excel workbook for three primary processes. The workbook also contains historical changeover and audit sheets for other model years and supporting trackers; the first app scope is the three workflows below.

- **Publication tracking:** a continuously updated list with assigned/pending work, Pending Edits, RTP, and Published sections. A new MMP is assigned with resource links/notes. After writing it moves to Pending Edits, then RTP, then Published. Pending Edits means the copy is in iMeet and ready for editing; an iMeet URL may be attached then but is optional and does not block the status change. Anyone on the team may change status; the author usually does this handoff, but a team member may do it for a freelancer who lacks app access. RTP means editing is complete and a new RTP-ready file has been uploaded to the same iMeet location; the URL stays the same. An editor typically makes that transition (often Rich), though any user with editing access may do so. The Production Assistant typically moves work to Published: use Published for the first time an MMP goes live, and Updated when new information is added to an existing page. Updated work remains in the published area and does not restart the new-page workflow. Record the publication date/time with an editable default. For scheduled embargoes, use the scheduled go-live time rather than the later time someone updates the tracker. Store a published-page URL once on the shared vehicle-year record and show it in the relevant views; unpublished pages have no URL. Keep the iMeet work-folder URL and other material links as task resources, separate from the public page URL.
- **Workflow timing:** all status changes are manual. Editors can enter or later edit the embargo time. It is informational, does not automatically change Status, and does not block workflow progression; it can be known before assignment/writing and meeting it may not be a priority. Scheduled status does not require an embargo time. For Published/Updated, default the publication timestamp to the scheduled go-live/embargo time when applicable, even if Status is changed later; the Production Assistant can manually correct it to actual go-live time. Use Eastern Time (ET) by default.
- **Task creation:** new work originates on Publication Tracking, not necessarily in Changeover (for example, concept cars). Make, Model, and Model Year are selected from database-backed lists; Segment is derived from the vehicle/model. A new vehicle must be added to the database before a task can be created. Make, Model, and Model Year are required; Author, Embargo Time, Deadline, Status, resource links, and Notes are optional. Notes capture vehicle changes or statements such as “no changes” / “no changes expected.” Every new task starts as Pending whether or not an author is assigned. Author assignment and Status remain independent throughout the task; changing/removing an Author never changes Status automatically.
- **Task resources:** provide a dedicated iMeet work-folder link and allow multiple separate material links. A material may have an optional access password, visible to editors only and hidden from view-only users. Protect stored credentials and do not expose them in general notes or logs.
- If an iMeet location changes, overwrite its current URL without retaining the previous URL in history.
- **Resource UI:** Editors add/edit resources in Add New Task/Edit Task. The folder icon is for opening existing resources only; gray and disabled when empty, black and active when populated.
- **Update-task design:** updates are new tasks and use the normal workflow. Users with edit access may move a task to any section at any time; transitions are not gated to a strict sequence. Add New Task defaults to New MMP and has an editable Update checkbox. New MMP maps to Published and Update maps to Updated at any time; changing the checkbox after publication immediately changes the status label to match.
- **Publication list layout:** provide separate Active Work and Published History views. Active Work contains Pending, Pending Edits, RTP, and Scheduled in one unpaginated sortable table for now. Default sort puts unassigned tasks in their own group first, then groups assigned tasks by team (Buyer's Guide, Car and Driver, Freelancers) and alphabetically by Author. Within each Author, dated tasks sort by nearest Deadline and undated tasks alphabetically by vehicle. Status remains visible and available for alternate sorting/filtering. Published and Updated entries are combined in one paginated chronological history list, distinguished by a Newly Published vs. Updated label, with 25 entries per page by default. Published History is sorted newest-first and never mixed into Active Work.
- **Active Work filters:** Make, Model, Model Year, Segment, Author/team, Status, New MMP/Update, and Deadline, plus text search. Filters are combinable.
- **Published History filters:** Make, Model, Model Year, Author/team, Newly Published vs. Updated, and publication date range.
- Show task Notes inline in Active Work; omit Notes from Published History. For now, show a 30-character preview for notes longer than 50 characters and provide “see more” for the full note.
- **Model-year Changeover:** an annual master vehicle list with assignment, status, research/notes, and a published-page URL only for Published rows. Other rows can keep a separate resource link that is never shared as a page URL. It records skipped, dead/cancelled, awaiting-info, and other non-published outcomes. The workbook includes a 2027 sheet and prior/future model-year sheets. “Double-check info?” belongs to Page Audit; Make Tags are dropped.
- **Annual Changeover roll-forward:** the team currently compiles this manually early in the year from (1) current-year Changeover entries whose status is not Dead, (2) current-year Page Audit as a completeness check, adding missing audited vehicles, and (3) next-year Page Audit vehicles that may already be published. Normalize capitalization when identifying Dead. Preferred feature: an Editor-triggered **Prepare Next Model Year** action that produces one next-year draft with source provenance and review/reconciliation; an Editor explicitly promotes the reviewed draft to the active working list. Promotion switches the default year; prior years remain accessible and editable. Merge matching Make/Model/Model Year entries into one row and flag conflicting details for review. Initialize generated rows as **Published** when the page already exists, otherwise **Awaiting Info**; do not carry forward source statuses. Do not build a simultaneous multi-year future outlook for initial scope.
- **Changeover statuses:** preserve **Awaiting Info, Info Available, Skipped, Dead, Vaporware, Published, and Embargoed**, normalizing inconsistent capitalization from imported data. Embargoed is a separate manual Changeover status, not derived from task Scheduled status or embargo time.
- **Manual Changeover additions:** Editors may add vehicles to an existing model-year list at any time, outside annual preparation. Use the shared Make/Model/Model Year catalog; create a new catalog vehicle first if needed.
- **Changeover summaries:** Total Open counts rows whose Author is `OPEN`. Count the seven statuses (Published, Awaiting Info, Info Available, Embargoed, Skipped, Dead, Vaporware). Show shares for the four production statuses against their combined total and shares for Skipped/Dead/Vaporware against all seven. Show full weeks and remaining days until the model-year deadline. Required pace is `ceil((Awaiting Info + Info Available + Embargoed) / fractional weeks remaining)`. Make the deadline editable per model year. The 2027 source formula for Skipped starts at row 10 although data starts at row 9; count all records in the app.
- **Changeover field scope:** Drop Make Tags. “Double-check info?” is a Page Audit follow-up flag for pages published before official information is available, based on “What’s New,” to prompt a later-in-year check for changes.
- **Cross-workflow sync:** when a Publication Tracking task is published or updated, set the matching Changeover row to **Published**. The public URL is stored once on the shared vehicle/model-year record. Status sync is one-way; a manual Changeover status change does not update the Publication Tracking task. Page Audit does not display a bare Published/Updated label; a date-stamped history remains a possible future enhancement.
- **Page Audit:** implemented as a year-specific checklist connected to the shared vehicle-year URL, with free-form checklist answers, separate 10 Best and Editors' Choice award values, source page status, author/auditor/date, Audit Notes, and a Double-check info follow-up flag. Expected answers drive green/yellow/red cell formatting, with pass/review/needs-work counts; awards do not affect those counts. The workbook seed imports 2026–2029.
- **Reference lists:** Make, Model, Segment, and Author should become editable controlled data. Each author belongs to Buyer's Guide (BG), Car and Driver (C/D), or Freelancers (FL). Selecting a make/model should fill the model's segment automatically.
- **Collaboration:** several people need shared, near-real-time updates. Speed versus the current spreadsheet is a release requirement, not a later polish item.
- **Initial access roles:** use only Editor and Viewer. Editors can change tasks, add/edit Makes, Models, Model Years, Segments, and Authors, and see resource passwords; Viewers are read-only and cannot see resource passwords. Team members may update freelancer work when the freelancer does not have app access.
- **Later capabilities:** user authentication and drag-and-drop are desired. Define account provisioning and drag/drop effects before implementation.
- **Access implication:** freelancers without app access are not given accounts initially; an Editor handles task/status updates for them. Account access for freelancers can be reconsidered later.

### Data-shape recommendation (to validate)

Keep Publication Tracking as its own fast, living view. Changeover and Page Audit are separate year-specific views connected to the same vehicle/model-year record, avoiding duplicate make/model/year data and public URLs. Preserve update events separately and link them to the published MMP. Repeat-audit retention rules still need a team decision.

### Backend decision

Supabase is selected for the backend, with the Free plan preferred for development and a small pilot. Microsoft hosting is not required. The schema draft uses Postgres, Supabase Auth, Row Level Security for Editor/Viewer roles, and Realtime for shared updates. The Free plan can pause after a week of low activity and does not include automatic database backups; plan and verify off-site exports before relying on it as the only production store. The migration and client scaffold are local only and have not been applied to a hosted project. The app supports email/password sign-in, reads task and author data, subscribes to task/resource/model-year changes, and persists edits to existing tasks and resources when configured. Without Supabase environment settings it stays in demo mode; with settings, it requires an authenticated profile and does not silently replace remote errors or empty data with samples. The current Editor/Viewer gate covers Publication Tracking task controls. See `supabase/README.md`.

The initial product focus was Publication Tracking. Changeover and Page Audit are now implemented as separate views over shared vehicle/year records; the next major workflow is annual Changeover preparation and reconciliation.

## Working preferences to confirm

These are proposals until the project owner confirms them:

- Keep Vue components focused and use TypeScript types for shared domain data.
- Keep domain rules in utilities/stores rather than duplicating them across views.
- Use existing design tokens and shared components when extending the interface.
- Keep sample data clearly separated from production data access.
- Prefer documenting workflow and architecture decisions here before committing to backend or integration choices.
- Preserve existing user data during any future storage migration; define backup and rollback before cutover.

## Decisions needed from the project owner

- Provide project URL and public anon key through local `.env.local` after creating/reviewing the Supabase project. Never expose the service-role key in the browser or source control.
- Establish and verify off-site database exports before production data migration.
- Supabase is the intended source of truth after migration; the workbook is the initial import source.
- Confirm account invitation/provisioning; Editor and Viewer roles are agreed, while email/password with Editor-provisioned accounts is the current implementation assumption.
- Browser/device support and accessibility target.
- Expected deployment and maintenance owner.
- Whether this repository should remain a lightweight standalone app or integrate with another internal system.
- Microsoft hosting is not required; confirm whether Microsoft sign-in is preferred or unnecessary.
- Expected number of concurrent users, record volume, and acceptable update/search latency.
- How Changeover rows are promoted to Publication Tracking and how audit work is created or repeated.
- Which Page Audit questions are required, optional, conditional, or not applicable, and whether each answer needs notes/evidence.
- Whether the app needs an explicit audit log and conflict-resolution workflow.

## Local commands

- `npm install` — install dependencies.
- `npm run dev` — start the local Vite development server.
- `npm run build` — create the production bundle.
- `npm run type-check` — run Vue and TypeScript checking.
- `npm run lint` — run ESLint with its current `--fix` option; be aware this can modify files.

## Git access note

The local checkout is on `main` tracking `origin/main`. The configured remote is `https://github.com/andberry89/mmp-tracking.git`. Remote access could not be verified during inspection because the environment could not resolve `github.com`; local repository inspection works.
