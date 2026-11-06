# To Do

This list is ordered by dependency. Email enhancements and other optional features remain deferred until after launch.

## Completed or accepted

- Responsive and accessibility pass accepted for the current app. Recheck affected breakpoints after adding Rankings and multi-segment labels.
- Basic security review completed. The anonymous `SECURITY DEFINER` permissions were removed; the remaining authenticated-function findings are intentional and authorization-checked. Leaked-password protection is unavailable on the current Supabase Free plan.
- Netlify selected; the first production deploy is working. Final Supabase production URLs and invitation-function CORS still need configuration against the chosen site URL.
- Editor/Viewer access, user management, account settings, and in-app invitation flow are implemented. End-to-end invitation setup still needs a release check.
- Resource passwords are stored separately and restricted to Editors by RLS.
- Browser title and favicon updated to MMP Tracking.
- MMP Published & Updated pagination, MMP status drag-and-drop, Changeover, Page Audit, and annual Changeover preparation are implemented.

## Remaining before launch — in order

1. [x] **Complete the full codebase audit.** The audit and first cleanup pass are recorded in [CODEBASE_AUDIT.md](CODEBASE_AUDIT.md). Follow-up data-integrity and scale fixes remain in the relevant workflow/reliability items below.

2. **Finish the required cross-workflow data and feature work.** Stabilize schema and behavior before importing the final workbook:
   - [x] Add the first Rankings view with a model-year selector, body-style filter, search, segment comparison, drag-and-drop ordering, unranked/future states, ratings, and award history. The feature is merged. Before team use, apply migrations `202611050001` and `202611050002` in order, then bulk-import 2027 ranks, segment placements, ratings, and awards. Andrew can provide a complete award-winners list to use as seed/import data.
   - [x] Give **Published & Updated** its own view, separate from Active Work, with pagination, useful date presets (including the past 90 days), and a custom date-range selector.
   - [x] Add Published/Updated totals and a model-year breakdown to that view, filtered by its selected date range; remove the duplicate Published & Updates section from the sidebar.
   - [x] Support multiple segment assignments per model-year vehicle. Show all assigned segments in Publication Tracking, Changeover, Page Audit, and Published History. Keep an independent rank for each vehicle/segment placement.
   - [x] Store one shared 1–10 rating in half-point steps. Editors can update it in Catalog, Rankings, and Page Audit.
   - [x] Share 10Best and Editors' Choice award history across Catalog, Rankings, and Page Audit. Treat misaligned EC year labels in the source workbook as errors, not awards. Backfill older ranking years later if desired.
   - [x] Use the shared Authors catalog for Page Audit and sync MMP task Author changes to the matching Changeover and Page Audit records. Historical multi-author audit values are reduced to the first listed Author.
   - [x] When a Changeover entry is marked Dead, keep it on Changeover, hide it from the active Page Audit list, and retain its audit record. Annual preparation already excludes Dead vehicles from the following model year.
   - [x] Apply `supabase/migrations/202611050003_sync_authors_and_hide_dead_audits.sql` in Supabase to enable the task-to-Changeover Author sync.

3. **Prepare the production environment before importing current data.**
   - Confirm the Netlify production URL and set Supabase Site URL and allowed redirects. The invitation-function origin allowlist is configured and deployed.
   - Establish and verify off-site database exports before applying data migrations or importing the final workbook.
   - Confirm the intended 30-day sign-in behavior against the current Supabase plan and implement the supported option.
   - Verify Auth, RLS, Realtime, Editor/Viewer access, and the in-app invitation flow with a test account.

4. **Import and reconcile the current workbook.** When Andrew provides the latest workbook, update Catalog, Publication Tracking tasks and history, current Changeover lists, and current Page Audits. Reconcile uncertain dates, vehicle matches, ratings, award history, and author values before applying the import. The 2027 Rankings data should be imported after its schema is stable.

5. **Import historical Page Audits.** Map older checklist formats and seed 2017–2025 as archive history after the current-year data and shared rating/award structure are settled.

6. **Complete reliability and performance work.** Realtime events now refresh only the affected task or model-year vehicle. Verify the applied migration for atomic task duplication and Changeover row/public-URL edits. Review dependency advisories, expected users/data volume, load time, search/update latency, and simultaneous editing behavior. Build automated tests for publication lifecycle, Realtime collaboration, Changeover, Page Audit, Rankings, access control, imports, and persistence.

7. **Finish the visual and responsive pass.** Refine all screens against the tracking-page baseline, update the style guide, and check the Rankings nav breakpoint and multi-segment layouts.
   - [x] Match Published & Updated task typography to Active Work.
   - Review keyboard and screen-reader use, contrast, and reduced-motion behavior.

8. **Launch.** Run the release review, confirm backups and access controls, deploy the release, and verify the production workflows with the team.

## Additional ideas — timing TBD

- Temporary MMP event tags for grouping work around events such as the New York Auto Show or Pebble Beach; clear the tag when a task is published.
- Editor profile pictures with upload size/type restrictions and cropping.

## Back burner — reassess after launch

- Publication history enhancements, update/version history, and links between later updates and existing MMPs.
- Click an author to see their assigned tasks.
- Page Audit conditional fields, evidence attachments, repeat-audit records, and change history. Also clean up the Edit Page Audit modal: change “How Many Galleries” guidance to “Single/Dual,” decide whether selected fields should use dropdowns or radio buttons, and consider conditional answer colors matching the table.
- Assignment notifications, email templates, and other email improvements.
