# To Do

Initial inventory from the prototype, project owner's description, and provided workbook. Priorities and owners are intentionally unset until the workflow and constraints are confirmed.

## Product discovery

- [x] Capture the three requested workflows: publication tracking, model-year changeover, and page audit.
- [ ] Walk through handoffs, approvals, exceptions, and current pain points.
- [ ] Decide how a Changeover row enters Publication Tracking and how audit work is started and closed.
- [x] Capture the current manual early-year Changeover compilation inputs: current Changeover excluding Dead, current Page Audit completeness check, and already-published vehicles from next-year Page Audit.
- [x] Add a preferred Editor-triggered **Prepare Next Model Year** draft action using the annual source sheets.
- [x] Prepare one next-year list at a time; defer simultaneous multi-year future planning.
- [x] On generation, default status to **Published** when the page already exists; otherwise **Awaiting Info**. Do not carry over source statuses.
- [x] Merge duplicate vehicles by Make/Model/Model Year and flag conflicting details for review.
- [x] Require an explicit Editor action to promote the reviewed next-year Changeover draft to the active working list.
- [x] Promotion switches the default Changeover year; keep prior years accessible and editable.
- [x] Allow Editors to manually add shared-catalog vehicles to existing model-year Changeover lists outside annual preparation; create new catalog vehicles first.
- [x] Drop Make Tags from Changeover; move “Double-check info?” to the deferred Page Audit as a later-in-year verification flag for MMPs published before official information is available.
- [x] Treat Changeover Embargoed as a separate manual status, independent of Publication Tracking Scheduled status or embargo time.
- [x] Keep status sync one-way: task publication updates Changeover; manual Changeover status edits do not change task status.
- [x] Define Changeover summary counts and deadline pacing from the workbook; count all rows rather than reproducing the source sheet's Skipped off-by-one range.
- [x] Make the Changeover deadline editable per model year.
- [x] Preserve the Changeover statuses Awaiting Info, Info Available, Skipped, Dead, Vaporware, Published, and Embargoed.
- [x] Sync Published status/public URL to Changeover and reflect publication/update plus the shared URL on Page Audit when an MMP task is published or updated. Keep Changeover status manually editable; defer detailed Page Audit workflow.
- [x] Define duplicate reconciliation and Editor promotion for generated Changeover drafts.
- [ ] Decide whether an update is a new version/event under an existing MMP and what history must be retained.
- [x] Confirm that Publication Tracking tasks can be created independently of Changeover, using database-backed Make, Model, and Model Year selections.
- [x] Set initial Status to Pending for every new task, whether or not an author is assigned.
- [x] Add a separate Notes field for vehicle changes or “no changes” / “no changes expected” context.
- [x] Support a dedicated iMeet link plus multiple material links; material links may include a password for protected sites.
- [x] Limit resource-password visibility to editors; hide passwords from view-only users.
- [ ] Decide how stored credentials are protected.
- [x] Start with two access roles: Editor and Viewer.
- [x] Allow all Editors to add and edit reference data (Makes, Models, Model Years, Segments, Authors).
- [x] Keep freelancers without app access outside the initial account system; an Editor handles their task/status updates.
- [x] Keep Author assignment and Status independent; changing/removing an Author never changes Status automatically.
- [x] Define Pending → Pending Edits as copy available in iMeet and ready for editing; allow a team member to perform the transition for a freelancer without app access.
- [x] Define Pending Edits → RTP as edited copy with a new RTP-ready file uploaded to the same iMeet location; the editor usually changes status, and the iMeet URL remains unchanged.
- [x] Define Published/Updated: the Production Assistant typically marks go-live; first publication is Published, while added information to an existing page is Updated.
- [x] Allow Pending Edits even if the iMeet URL has not yet been added.
- [x] Replace the iMeet URL if the work-folder location changes; do not retain the previous URL in history.
- [x] Capture public live-page URL once on a shared record and reuse it in Publication Tracking, Changeover, and Page Audit; keep the iMeet folder URL distinct.
- [x] Default publication date/time to the scheduled go-live time for embargoed pages, even if status is updated later; allow user override.
- [x] Use Eastern Time (ET) as the default for embargo and publication timestamps.
- [x] Allow the Production Assistant to manually change the scheduled publication timestamp to the actual go-live time when they differ.
- [x] Keep all status changes manual; embargo times are informational and never auto-advance or block workflow.
- [x] Allow Editors to enter or edit embargo times without changing Status.
- [x] Allow Scheduled status without an embargo time.
- [x] Run update tasks through the normal workflow; allow users with edit access to move tasks to any section at any time.
- [x] Default new tasks to New MMP and provide an editable Update checkbox; use it to label published work Published vs. Updated.
- [x] Keep the Published/Updated status label synchronized if the Update checkbox is changed after publication.
- [x] Preserve inline Notes preview with a “see more” full-note popover and a dedicated resource-folder affordance.
- [x] Show Notes in Active Work only; omit Notes from Published History.
- [ ] Match resource-folder behavior: disabled gray when empty; active black when populated. Move resource add/edit controls into Add New Task/Edit Task.
- [x] Keep current Notes preview for now: 30 characters when the note exceeds 50 characters.
- [x] Separate Publication Tracking into Active Work (Pending, Pending Edits, RTP, Scheduled) and Published History (Published and Updated together, never mixed with active items).
- [x] Default Active Work sorting by Author, then nearest Deadline within author; undated items alphabetically by vehicle.
- [x] Put tasks without an assigned Author in a separate group at the top of Active Work.
- [x] Sort assigned groups by team (Buyer's Guide, Car and Driver, Freelancers), then alphabetically by Author.
- [x] Sort Published History newest-first.
- [x] Add first-release Active Work filters for Make, Model, Model Year, Segment, Author/team, Status, New MMP/Update, and Deadline, plus text search.
- [x] Allow multiple Active Work filters to be combined.
- [x] Keep Active Work unpaginated for now; paginate Published History.
- [x] Use 25 entries per page for Published History by default.
- [x] Add Published History filters for Make, Model, Model Year, Author/team, Newly Published vs. Updated, and publication date range.
- [x] Limit task creation and reference-data editing to Editors; Viewers are read-only.
- [x] Select Supabase as the intended source of truth for live app data; treat the workbook as the initial import source. Microsoft hosting is not required.
- [ ] Choose frontend hosting and confirm any organization-specific security restrictions.
- [ ] Agree on expected users/records, acceptable search/update latency, and first release scope.
- [ ] Confirm which visual choices should carry forward; update [STYLE_GUIDE.md](STYLE_GUIDE.md).

## Product and technical gaps

- [x] Run an initial code audit, repair TypeScript/lint setup errors, and connect existing search/author/date filters to the MMP list. See [CODEBASE_AUDIT.md](CODEBASE_AUDIT.md).
- [ ] Decide whether to apply the remaining Vue formatting warnings in a dedicated style-only pass.
- [ ] Continue the visual-design pass across the current auth, task, and reference-data screens; review the tracking-page baseline with the user before extending it to Changeover and Page Audit.
- [x] Draft shared relational data around vehicle/model years, production work, and Changeover; keep detailed Page Audit schema deferred.
- [x] Select Supabase as the backend; add the SDK, local client scaffold, login gate, task/author reads, Realtime subscriptions, and persistence for existing task edits/resources.
- [x] Review and apply the initial schema migration to the new Supabase project.
- [ ] Provision initial Editors and verify Auth, Realtime, and RLS in the project.
- [ ] Establish and verify off-site exports before using the Free plan as the only production data store.
- [ ] Review and resolve dependency advisories before production; `npm audit --omit=dev` currently reports 10 vulnerabilities (9 high, 1 critical).
- [ ] Import and reconcile workbook history, including inconsistent spellings, repeated year tabs, embedded notes/URLs, and varied statuses.
- [ ] Add editable Make, Model, Segment, and Author records; constrain Author teams to Buyer's Guide (BG), Car and Driver (C/D), and Freelancers (FL).
- [ ] Auto-populate a model's segment when selecting make and model on a new task.
- [ ] Implement year-specific Changeover fields for assigned Author, status, notes/research, and the shared published URL. “Double-check info?” belongs in Page Audit; Make Tags are dropped.
- [ ] Add a Page Audit checklist with typed answers and visibility for incomplete items.
- [ ] Keep later updates linked to the existing published MMP without restarting the new-page lifecycle.
- [ ] Add fast server-side search/filtering and pagination for the continuously updated publication view.
- [ ] Define visible conflict handling for two people editing the same record.
- [ ] Add drag-and-drop behavior for agreed queue interactions.
- [x] Add email/password sign-in and Editor/Viewer gating for Publication Tracking task controls; new accounts default to Viewer in the schema.
- [x] Add invitation-link password setup for initial Auth accounts.
- [x] Wire the visible “Add New Task” control to a create flow with Make/Model/Model Year selection, automatic Segment display, task details, and resources.
- [ ] Add an Editor interface to manage Make, Model, Segment, and Model Year catalog data; demo mode currently derives options from sample tasks.
- [ ] Define loading, empty, error, and save-feedback behavior for real data.
- [ ] Define account invitation/provisioning, audit history, and deployment requirements.
- [ ] Confirm the pilot's account provisioning approach; the current login scaffold assumes accounts are created/invited by an Editor and has no public sign-up.
- [ ] Define responsive and accessibility requirements.
- [ ] Add automated checks for the agreed critical workflows.

## Maintenance

- [ ] Keep this list aligned with the agreed roadmap and decisions.
- [ ] Record implementation preferences and architecture decisions in [TECH_HANDOFF.md](TECH_HANDOFF.md).
