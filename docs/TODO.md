# To Do

Status reconciled with project work through November 25, 2026. The app is live; email enhancements and optional features remain deferred.

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
- Automated test suite now covers publication lifecycle and ordering, Changeover/Page Audit/Rankings workflows, role access, realtime collaboration updates, persisted row mapping, database import/migration contracts, and Rankings save/rollback behavior. UI/browser-level tests and tests against a live Supabase project are not included.
- Visual/accessibility refinements implemented: Page Audit edit fields show state dots with matching screen-reader labels; task action popovers keep their white surface on hover; Manage Users rows are tinted by account state; reduced-motion preferences are respected throughout the app; Page Audit loading announces itself and table column headings are programmatically identified.
- Active Work event tags are implemented for temporary groupings such as auto shows and press events. Editors can assign or remove tags, reuse tags already on Active Work tasks, filter by tag, group tasks by their first assigned tag inside each status section, and duplicate tagged tasks. Tag colors are consistent across the workboard and task editor, and tags clear automatically when a task is Published or Updated.

## Current priorities

Manual review of the visual/accessibility refinements is next.

## Remaining work

- **Page Audit and Rankings exports:** add CSV or Excel export options.
- **Manual visual/accessibility review:** confirm the updated views, keyboard and screen-reader operation, color contrast, and reduced-motion behavior. The current responsiveness pass was accepted.
- **Operational review:** verify backups and access controls, then confirm production workflows with the team.

## Additional ideas — timing TBD

- Editor profile pictures with upload size/type restrictions and cropping.

## Post-launch follow-ups — timing TBD

- **Realtime and performance follow-up (next week):** check that simultaneous edits do not move another user's scroll position or discard unsaved changes, and review expected workload plus load/search/update speed.
- **Dependency security alerts:** check whether any of the app's software packages have known security vulnerabilities, then update or otherwise address affected packages.
- Publication history enhancements, update/version history, and links between later updates and existing MMPs.
- Click an author to see their assigned tasks.
- Page Audit conditional fields, evidence attachments, repeat-audit records, and change history. Also revisit the Edit Page Audit modal's field controls and conditional answer colors.
- Assignment notifications, custom Auth email templates, and other email improvements. The Editor-generated recovery-code path currently handles account recovery without a provider.
