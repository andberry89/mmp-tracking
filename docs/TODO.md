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

1. **Complete the full codebase audit.** Review dead/stale code, data flow, formatting, dependency risks, performance hotspots, comments, and critical workflows. Keep the cleanup focused on changes that make the app safer or easier to maintain.

2. **Finish the required cross-workflow data and feature work.** Stabilize schema and behavior before importing the final workbook:
   - Build **Rankings** with a 2027 focus and year selector. Support body-style filters, search, comparing multiple segments, and drag-and-drop rank order within each segment.
   - Give **Published & Updated** its own view, separate from Active Work. Keep its pagination and add date filters with useful presets (including the past 90 days) and a custom date-range selector.
   - Support multiple segment assignments per model-year vehicle. Show all assigned segments in Publication Tracking, Changeover, and Page Audit. Keep an independent rank for each vehicle/segment placement.
   - Store one shared 1–10 rating in half-point steps. Editors can update it wherever it appears in Catalog, Rankings, or Page Audit.
   - Share 10Best and Editors' Choice award history across Catalog, Rankings, and Page Audit. Treat misaligned EC year labels in the source workbook as errors, not awards. Backfill older ranking years later if desired.
   - When an MMP task's Author changes, update the matching Changeover assignment. Keep Page Audit author names separate unless the team decides they should represent the current assignment too.
   - Define the workflow for marking a model Dead after publication: keep it in Changeover and remove it from Page Audit.

3. **Prepare the production environment before importing current data.**
   - Confirm the Netlify production URL, then set Supabase Site URL and allowed redirects and restrict invitation-function CORS to that origin.
   - Establish and verify off-site database exports before applying data migrations or importing the final workbook.
   - Confirm the intended 30-day sign-in behavior against the current Supabase plan and implement the supported option.
   - Verify Auth, RLS, Realtime, Editor/Viewer access, and the in-app invitation flow with a test account.

4. **Import and reconcile the current workbook.** When Andrew provides the latest workbook, update Catalog, Publication Tracking tasks and history, current Changeover lists, and current Page Audits. Reconcile uncertain dates, vehicle matches, ratings, award history, and author values before applying the import. The 2027 Rankings data should be imported after its schema is stable.

5. **Import historical Page Audits.** Map older checklist formats and seed 2017–2025 as archive history after the current-year data and shared rating/award structure are settled.

6. **Complete reliability and performance work.** Replace full task-list reloads on each Realtime event with scoped updates or refetches. Review dependency advisories, expected users/data volume, load time, search/update latency, and simultaneous editing behavior. Build automated tests for publication lifecycle, Changeover, Page Audit, Rankings, access control, imports, and persistence.

7. **Finish the visual and responsive pass.** Refine all screens against the tracking-page baseline, update the style guide, and check the Rankings nav breakpoint and multi-segment layouts. Review keyboard and screen-reader use, contrast, and reduced-motion behavior.

8. **Launch.** Run the release review, confirm backups and access controls, deploy the release, and verify the production workflows with the team.

## Additional ideas — timing TBD

- Temporary MMP event tags for grouping work around events such as the New York Auto Show or Pebble Beach; clear the tag when a task is published.
- Editor profile pictures with upload size/type restrictions and cropping.

## Back burner — reassess after launch

- Publication history enhancements, update/version history, and links between later updates and existing MMPs.
- Click an author to see their assigned tasks.
- Page Audit conditional fields, evidence attachments, repeat-audit records, and change history. Also clean up the Edit Page Audit modal: change “How Many Galleries” guidance to “Single/Dual,” decide whether selected fields should use dropdowns or radio buttons, and consider conditional answer colors matching the table.
- Assignment notifications, email templates, and other email improvements.
