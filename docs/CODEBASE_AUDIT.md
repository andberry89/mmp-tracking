# Codebase Audit

Initial audit of the Vue prototype on 2026-10-23. Scope: source/config inspection and the project's TypeScript check; no application test suite was run.

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

## High-priority issues before adding more workflow features

1. **There is no durable or shared data layer.** `src/stores/documents.ts` simulates loading and uses `src/test/test-documents.ts` as fallback data. Edits, deletes, duplicates, and assignments only change the in-memory Pinia store and disappear on reload. The current architecture cannot provide multi-user live updates.
2. **The visible search and filters do not affect the task list.** `MainContent.vue` computes `filteredDocuments` only in one branch (MMP view with a non-empty search), and the active `TaskPage`/`TaskList` renders from the whole store instead of consuming that result. Status and make filters are recorded but not applied. This should be fixed as part of Publication Tracking, with server-side querying once a backend is selected.
3. **Task creation is not wired.** “Add New Task” is a static section with no event or form.
4. **The page states need to reflect the agreed workflow.** The current list has Pending, Ready to Publish, and Published sections; RTE is grouped with pending, Scheduled with RTP, and Updated with Published. Every new task will start Pending, regardless of assignment. Confirm later assignment/status transitions and exact display before restructuring statuses.
5. **Several navigation destinations are placeholders.** Makes, Models, Segments, and Authors pages are welcome screens, not editable reference-data screens.
6. **Pagination and server-side filtering do not exist.** All sample documents are held and sorted in the browser. That will not scale to a large historical dataset or meet the spreadsheet-speed requirement by itself.
7. **Some controls imply behavior that is not implemented.** Sort/filter icons and several non-MMP header filters do not perform their advertised actions. `DashboardSidebar`'s “Show” range menu is not connected to the stats.
8. **Task-note behavior matches the current preference.** `TaskNotes.vue` hides notes for published tasks, as requested for Published History. In Active Work, it shows a 30-character preview when the note exceeds 50 characters and opens the full note in a popover. The team confirmed keeping this behavior for now.
9. **Resource-folder empty state differs from the desired interaction.** `TaskAssets.vue` currently lets the folder icon open its popover even with no resources, and the popover contains an Add New Asset form. The desired behavior is a gray disabled folder when empty and a black active folder that opens existing resources. Editors add/edit resources in the Add New Task/Edit Task forms; the folder icon is view-only.

## Cleanup sequence

1. Finish the Publication Tracking workflow and acceptance criteria with the team.
2. Choose the shared backend and deploy/auth constraints before building data access into UI components.
3. Define normalized records, status transitions, update history, concurrency behavior, and import mapping.
4. Implement a typed API/data-access layer and server-side filtering/pagination; keep Pinia for view state and cached data where useful.
5. Wire task creation and the agreed list controls to the data layer.
6. Replace sample-only fixtures with explicit development seed data, separate from production loading.
7. Add automated checks after the first workflow and its persistence behavior are agreed.

## Verification

- `npm run type-check` passes after the repairs above.
- `npm run lint` exits successfully without `--fix`, with 150 Vue formatting/style warnings remaining. `npm run lint -- --quiet` passes with no errors.
- `git diff --check` passes.
- No build or automated tests were run.
