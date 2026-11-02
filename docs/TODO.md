# To Do

This is the current roadmap. Email work and the other listed enhancements are deferred until after launch, when we can reassess whether they are needed.

## Active before launch

1. **Finish the visual pass.** Refine the existing screens against the tracking-page baseline and keep the style guide current.
2. **Address responsiveness and accessibility.** Define the expected device sizes and keyboard/screen-reader behavior, then make the key workflows work well within those constraints.
3. **Production readiness.**
   - Choose frontend hosting and confirm organization-specific security restrictions.
   - Provision initial Editors and verify Supabase Auth, Realtime, and Row Level Security.
   - Establish and verify off-site database exports.
   - Review dependency advisories and resolve production risks.
   - Confirm expected users and data volume; review load time, search/update latency, and simultaneous editing behavior.
   - Confirm how resource passwords are protected.
   - Decide where to mark a model Dead after publication; keep it on Changeover and remove it from Page Audit.
   - Confirm the Changeover-to-Publication Tracking and Page Audit handoffs.
4. **Import past Page Audits.** Map older checklist formats and seed the 2017–2025 sheets as archive history.
5. **Load the most current workbook.** Once provided, prepare and reconcile the current Publication Tracking tasks/history, Changeover lists, Page Audits, and Catalog data; review uncertain dates, vehicle matches, and historical author values before applying the import.
6. **Complete a full codebase audit.** Remove dead or stale code, streamline slow or repetitive processes, add useful comments where they clarify intent, and review formatting and critical workflow coverage.
7. **Launch.** Complete the release review and deploy after the active items above are ready.

## Back burner: reassess after launch

- **Publication history enhancements.** Revisit update/version history, links between later updates and existing MMPs, and any further history features beyond the current Published & Updated list and pagination.
- **Author task view.** Let users click an author to see their assigned tasks.
- **Page Audit enhancements.** Revisit conditional checklist fields, evidence attachments, repeat-audit records, and change history. Clean up the Edit Page Audit modal: change the “How Many Galleries” guidance from “Dual” to “Single/Dual”; decide whether selected fields should use dropdowns or radio buttons; consider conditional answer colors that match the Page Audit table.
- **Email-related work.** Reassess assignment notifications, email templates, and other email improvements after launch.

## Recently completed

- [x] Change the Page Audit cell color for **Pricing under lead image? = “Yes, estimated”** from red to yellow.
- [x] Replace the browser title “Vite App” with “MMP Tracking” and add the matching SVG favicon.
