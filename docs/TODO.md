# To Do

Status reconciled with project work through November 23, 2026. Email enhancements and optional features remain deferred until after launch.

## Completed

- Responsive and accessibility pass accepted for the current app. Recheck affected layouts when new UI is added.
- First full codebase audit and cleanup pass completed; findings are in [CODEBASE_AUDIT.md](CODEBASE_AUDIT.md).
- Basic Supabase security review completed. Public `SECURITY DEFINER` access was removed; remaining authenticated functions are authorization-checked. Leaked-password protection is unavailable on the current Supabase Free plan.
- Netlify production hosting and Supabase production URL/redirect configuration are in place.
- Editor/Viewer access, account settings, user management, invitations, and Editor-generated one-time password recovery codes are implemented. Joey used the recovery code flow to set his password and access the app.
- Editor-only resource passwords and the 30-day client-side sign-out are implemented. Realtime updates are scoped to the affected task or model-year vehicle.
- Browser title/favicon, MMP drag-and-drop, Published & Updated view/pagination/summary cards, Changeover, Page Audit, annual Changeover preparation, and Rankings are implemented.
- Latest workbook refresh is complete for 2027 Changeover, 2026–2029 Page Audits, Active Work, and Published & Updated.
- Historical Page Audits for 2017–2025 were seeded and checked; no mismatches were reported.
- 2020–2027 Rankings placements were imported and reconciled with the workbook: zero extra or missing placements, and zero rank or rating mismatches. 10Best, Editors’ Choice, and EV of the Year histories were refreshed from the supplied source-of-truth files and all 12 Catalog-matched batches verified with no missing or extra award records.
- Page Audit's C/D rating now uses the shared model-year rating, so editors enter it once. It remains part of the checklist score and is displayed in the Rating column.

## Current priorities

1. **Improve annual Rankings membership.** Let Editors add or remove a vehicle/segment placement from a year’s list without changing shared Catalog, Changeover, or Page Audit membership. Support future vehicles in earlier-year lists (for example, the 2028 Mercedes GLA-Class EV in the 2027 Electric Compact Luxury SUVs list), and explain why a year can appear in the selector before placements are added.
2. **Improve Rankings search.** Keep every vehicle visible within matching segments, hide segments with no matching make/model, and highlight matching text. For example, searching “X3” should match both X3 and iX3 while still showing all vehicles in those segments.
3. **Clean up Catalog model editing.** Make the multi-segment assignment area easier to scan and edit.
4. **Add a persistent manual refresh action.** Allow users to reload current database data from a visible, consistent control.
5. **Make errors more recognizable.** Improve the visual treatment of error messages across the app so they are clearly distinct from routine status messages.

## Remaining before launch

- **Backups:** choose a secure off-site destination, export the database, and verify that a restore works before relying on Supabase as the only production store.
- **Reliability and performance:** verify atomic task duplication and Changeover row/URL edits in production; review dependency advisories, expected workload, load/search/update speed, and simultaneous editing behavior.
- **Automated tests:** cover publication lifecycle, Realtime collaboration, Changeover, Page Audit, Rankings, role access, imports, and persistence.
- **Final visual and accessibility pass:** check remaining pages, keyboard and screen-reader operation, contrast, and reduced motion. The current responsiveness pass was accepted.
- **Release review:** verify backups and access controls, then confirm the production workflows with the team.

## Additional ideas — timing TBD

- Temporary MMP event tags for grouping work around events such as the New York Auto Show or Pebble Beach; clear a task's tag when it is published.
- Editor profile pictures with upload size/type restrictions and cropping.

## Back burner — reassess after launch

- Publication history enhancements, update/version history, and links between later updates and existing MMPs.
- Click an author to see their assigned tasks.
- Page Audit conditional fields, evidence attachments, repeat-audit records, and change history. Also revisit the Edit Page Audit modal's field controls and conditional answer colors.
- Assignment notifications, custom Auth email templates, and other email improvements. The Editor-generated recovery-code path currently handles account recovery without a provider.
