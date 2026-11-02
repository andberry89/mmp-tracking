# Codebase Audit

The 2026-10-23 section below is a historical audit of the original prototype. Its blocking findings were resolved as the app gained Supabase persistence, authentication, and the Publication Tracking, Catalog, Changeover, and Page Audit workflows. See the 2026-11-02 follow-up at the end for current findings.

## Repairs made

- Fixed the TypeScript errors reported by `vue-tsc`, including the stale search variable, invalid type references, incomplete author/document sample types, and missing status map import.
- Made task action event emission explicit so TypeScript can verify each action.
- Fixed modal date handling to use the model's empty-string representation and removed a stale unused helper.
- Removed an unused prop destructure and unused page-header handlers/import.
- Changed the lint script to report lint issues without automatically rewriting source files.
- Removed the task rule that erased notes on Ready to Edit. Scheduled tasks now receive the default note only when the notes field is empty.
- Removed development console logging from document loading.
- Repaired the ESLint configuration to use the TypeScript packages already declared by the project and the available Vue flat config. Removed unused imports/placeholder scripts and fixed its TypeScript project selection.
- Fixed the task list's search/author/date filter path so `MainContent` always returns grouped records and the list renders that filtered result.

## Original high-priority issues (historical snapshot)

1. **There is no durable or shared data layer.** `src/stores/documents.ts` simulates loading and uses `src/test/test-documents.ts` as fallback data. Edits, deletes, duplicates, and assignments only change the in-memory Pinia store and disappear on reload. The current architecture cannot provide multi-user live updates.
2. **The visible search and filters do not affect the task list.** `MainContent.vue` computes `filteredDocuments` only in one branch (MMP view with a non-empty search), and the active `TaskPage`/`TaskList` renders from the whole store instead of consuming that result. Status and make filters are recorded but not applied. This should be fixed as part of Publication Tracking, with server-side querying once a backend is selected.
3. **Task creation is not wired.** “Add New Task” is a static section with no event or form.
4. **The page states need to reflect the agreed workflow.** The current list has Pending, Ready to Publish, and Published sections; RTE is grouped with pending, Scheduled with RTP, and Updated with Published. Every new task will start Pending, regardless of assignment. Confirm later assignment/status transitions and exact display before restructuring statuses.
5. **Several navigation destinations are placeholders.** Makes, Models, Segments, and Authors pages are welcome screens, not editable reference-data screens.
6. **Pagination and server-side filtering do not exist.** All sample documents are held and sorted in the browser. That will not scale to a large historical dataset or meet the spreadsheet-speed requirement by itself.
7. **Some controls imply behavior that is not implemented.** Sort/filter icons and several non-MMP header filters do not perform their advertised actions. `DashboardSidebar`'s “Show” range menu is not connected to the stats.
8. **Task-note behavior matches the current preference.** `TaskNotes.vue` hides notes for published tasks, as requested for Published History. In Active Work, it shows a 30-character preview when the note exceeds 50 characters and opens the full note in a popover. The team confirmed keeping this behavior for now.
9. **Resource-folder empty state differs from the desired interaction.** `TaskAssets.vue` currently lets the folder icon open its popover even with no resources, and the popover contains an Add New Asset form. The desired behavior is a gray disabled folder when empty and a black active folder that opens existing resources. Editors add/edit resources in the Add New Task/Edit Task forms; the folder icon is view-only.

## Original cleanup sequence (historical snapshot)

1. Finish the Publication Tracking workflow and acceptance criteria with the team.
2. Choose the shared backend and deploy/auth constraints before building data access into UI components.
3. Define normalized records, status transitions, update history, concurrency behavior, and import mapping.
4. Implement a typed API/data-access layer and server-side filtering/pagination; keep Pinia for view state and cached data where useful.
5. Wire task creation and the agreed list controls to the data layer.
6. Replace sample-only fixtures with explicit development seed data, separate from production loading.
7. Add automated checks after the first workflow and its persistence behavior are agreed.

## Original verification (2026-10-23)

- `npm run type-check` passes after the repairs above.
- `npm run lint` exits successfully without `--fix`, with 150 Vue formatting/style warnings remaining. `npm run lint -- --quiet` passes with no errors.
- `git diff --check` passes.
- No build or automated tests were run.

## Follow-up review — 2026-11-02

### Cleanup completed

- Replaced the starter Vite README with project setup, commands, architecture, and links to the Supabase handoff.
- Removed the obsolete `main.ts` checklist that still proposed MongoDB, first-generation navigation, and features already implemented.
- Removed the unused `test-makes.ts` fixture and its barrel export.
- Simplified the legacy header config to the Publication Tracking filters that are actually rendered; removed unused Make/Status filter state.
- Confirmed `.env.local` is ignored by Git; only the public browser key is read in Vite client code. Resource passwords are stored separately and their table has an Editor-only RLS policy.

### Remaining codebase and production concerns

- `src/test/` contains demo fixtures, not an automated test suite; `package.json` has no test command or test-runner dependency.
- Publication Tracking currently reloads the full task collection after each Realtime event for tasks, resources, or model-year vehicles. Server-side search and pagination should be evaluated against the expected production volume and simultaneous editing load.
- Production hosting, Supabase exports/backups, the latest workbook import, and the expected workload still require owner decisions or verification; these remain tracked in `docs/TODO.md`.

### Security review — 2026-11-02

**Good controls found in the repository:** app tables have RLS enabled; the current access migration requires an active allowlisted account, and Editor writes are gated by role policies. Viewers cannot read the separate resource-password table. User administration runs through Editor-checked RPCs, and the invitation Edge Function verifies its JWT, active allowlist entry, and Editor role before using the server-side service-role key. The browser uses only the public Supabase key.

**Before launch, verify or decide:** disable public sign-ups if the app is invitation-only; review Auth redirect allowlists, password and session rules, and available abuse/rate controls; consider rate limiting invitation sends; restrict invitation-function CORS to the deployed app origin once hosting is selected; and decide whether storing press-site passwords as database text protected by RLS is sufficient for the team. Repository inspection cannot confirm the live Supabase Dashboard settings or run the Supabase Security Advisor against the hosted project.

No application tests or type-check were run during this follow-up review. The changed files were checked with `git diff --check`.
