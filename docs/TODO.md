# To Do

Status reconciled with project work through November 24, 2026. Email enhancements and optional features remain deferred until after launch.

## Completed

- Responsive and accessibility pass accepted for the current app. Recheck affected layouts when new UI is added.
- First full codebase audit and cleanup pass completed; findings are in [CODEBASE_AUDIT.md](CODEBASE_AUDIT.md).
- Basic Supabase security review completed. Public `SECURITY DEFINER` access was removed; remaining authenticated functions are authorization-checked. Leaked-password protection is unavailable on the current Supabase Free plan.
- Netlify production hosting and Supabase production URL/redirect configuration are in place.
- Editor/Viewer access, account settings, user management, invitations, and Editor-generated one-time password recovery codes are implemented. Joey used the recovery code flow to set his password and access the app.
- Editor-only resource passwords and the 30-day client-side sign-out are implemented. MMP task Realtime updates are scoped to the affected task or model-year vehicle.
- Browser title/favicon, MMP drag-and-drop, Published & Updated view/pagination/summary cards, Changeover, Page Audit, annual Changeover preparation, and Rankings are implemented.
- Latest workbook refresh is complete for 2027 Changeover, 2026–2029 Page Audits, Active Work, and Published & Updated.
- Historical Page Audits for 2017–2025 were seeded and checked; no mismatches were reported.
- 2020–2027 Rankings placements were imported and reconciled with the workbook: zero extra or missing placements, and zero rank or rating mismatches. 10Best, Editors’ Choice, and EV of the Year histories were refreshed from the supplied source-of-truth files and all 12 Catalog-matched batches verified with no missing or extra award records.
- Page Audit's C/D rating now uses the shared model-year rating, so editors enter it once. It remains part of the checklist score and is displayed in the Rating column.
- Annual Rankings membership is managed separately from Catalog Segment assignments. Editors can add/remove placements by Rankings year, including future model-year vehicles in earlier-year lists.
- Rankings search matches make/model text, keeps all vehicles visible in any matching segment, hides segments without matches, and highlights the matches.
- Page Audit's shared rating now sits inside the fixed Vehicle / Segment cell, beside the vehicle details and before the edit action.
- Catalog model-year segment choices are grouped by body style and sorted alphabetically; selected and archived segments are easier to scan in both add and edit forms.
- A persistent header Refresh action reloads shared Catalog, author, and MMP data plus Changeover, Page Audit, Rankings, and Published & Updated data while preserving the selected year and publication filters.
- Errors across the app use a shared high-contrast alert with a warning icon; compact forms and popovers use the same visual treatment at a smaller size.
- Encrypted daily Supabase database exports are installed in OneDrive. A disposable local restore drill succeeded: all 16 public application tables and 29 RLS policies restored with foreign-key checks enabled. Auth accounts and Storage objects are outside the CLI export and require separate recovery. OneDrive currently blocks automatic retention cleanup in the background job, so old archives need manual removal.
- Initial automated tests now cover publication lifecycle rules, MMP task ordering, and author/team grouping.

## Current priorities

No current-priority items remain.

## Remaining before launch

- **Reliability and performance:** verify atomic task duplication and Changeover row/URL edits in production; ensure real-time changes do not move another user's scroll position or discard unsaved edits, including when two Editors change the same record; review dependency advisories, expected workload, and load/search/update speed.
- **Page Audit and Rankings exports:** add CSV or Excel export options.
- **Automated tests:** expand coverage to Changeover, Page Audit, Rankings, role access, Realtime collaboration, imports, and persistence; add component-level workflow checks where valuable.
- **Final visual and accessibility pass:** check remaining pages, keyboard and screen-reader operation, contrast, and reduced motion. The current responsiveness pass was accepted.
  - Add green/yellow/red indicators beside each field in the Edit Page Audit modal, using the same completion rules and colors as the audit table.
- **Release review:** verify backups and access controls, then confirm the production workflows with the team.

## Additional ideas — timing TBD

- Temporary MMP event tags for grouping work around events such as the New York Auto Show or Pebble Beach; clear a task's tag when it is published.
- Editor profile pictures with upload size/type restrictions and cropping.

## Back burner — reassess after launch

- Publication history enhancements, update/version history, and links between later updates and existing MMPs.
- Click an author to see their assigned tasks.
- Page Audit conditional fields, evidence attachments, repeat-audit records, and change history. Also revisit the Edit Page Audit modal's field controls and conditional answer colors.
- Assignment notifications, custom Auth email templates, and other email improvements. The Editor-generated recovery-code path currently handles account recovery without a provider.
