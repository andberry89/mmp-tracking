# Current Workflows

This is a process summary from the project owner's description and the provided Excel workbook. Workbook cell text is treated as source data about current practice; incidental notes inside the file are not app instructions. Status names and examples below should be confirmed with the team before implementation.

## 1. Publication Tracking and Status

This is the living operational queue. The team records make, model, segment, model year, author, optional deadline, status, embargo/publication date, and resources or notes alongside an MMP.

The described new-page path is:

`Assigned / Pending → Pending Edits → RTP → Published`

The workbook currently has separate sections for assigned/pending work, Pending Edits, RTP, and Published - 2026 Calendar Year. The exact meaning of each transition, who performs it, and any intermediate approval are to be confirmed.

**Pending → Pending Edits** is a handoff indicating that the copy is in iMeet and ready for editing. An iMeet URL may be attached at this point, but it is optional and does not block the status change. Anyone on the team may change the status; usually the author does, but a team member may do it for a freelancer who cannot access the app. The app therefore needs a way for team members to perform this handoff on another person's behalf.

**Pending Edits → RTP** means the copy has been edited and a new RTP-ready file has been uploaded to the same iMeet location. The iMeet URL remains the same. The editor typically changes the status (often Rich), but anyone with editing access may do so.

**RTP → Published/Updated** is typically done by the Production Assistant. Use **Published** when an MMP goes live for the first time. Use **Updated** when additional information is added to a page that already existed. Updates remain in the published area and do not restart the new-page workflow.

All Status changes are manual; no date or field automatically moves a task between workflow states. Editors can enter or later edit the embargo time. It is informational and does not block or advance the workflow. It may be entered before assignment or writing, and a task may have an embargo time even when meeting it is not a priority. A task may be marked Scheduled without an embargo time; the app must not require one.

Record the publication date/time, defaulting to the relevant go-live time, and allow the Production Assistant to overwrite it. For a page with a future embargo, the publication timestamp should represent that scheduled go-live time even if the Production Assistant only changes Status later (for example, on Monday after a Saturday release). The status-entry time must not replace the scheduled publication time. If the actual go-live time differs, the Production Assistant can manually correct the timestamp.

Use Eastern Time (ET) as the default time zone for embargo and publication timestamps.

Capture the public live-page URL once on the shared published-page/vehicle record, and only when the page is published. Publication Tracking, Changeover, and Page Audit may display or link to that same URL rather than maintaining separate copies. Unpublished Changeover rows may have a separate resource link, labeled “Open resource”; it must never populate the shared published-page URL or appear in Page Audit. Page Audit shows only the published URL read-only and does not accept resource links. Keep the iMeet work-folder URL as a separate task link because it points to source files, not the public page.

An update to an already-published MMP is recorded under the published area rather than sent through the new-page path. In the app, represent it as a distinct update event connected to the existing MMP/page so update history is retained and it does not inflate the new-page queue. Confirm whether a substantial rewrite should be treated differently.

An update is represented as a new task and follows the normal workflow, making it easy to move through the same sections as a new MMP. Users with edit access can move a task to any section at any time; the app should not force a strict sequence of status transitions.

Add New Task should default to **New MMP** and include an editable checkbox to mark it as an **Update**. This work-type value determines the publication label at any time: New MMP → **Published**, Update → **Updated**. If the checkbox changes after publication, the status label changes immediately to match.

The page should remain independently usable as a quickly searchable, filterable, sortable, paginated, frequently updated queue.

### Publication list display

Publication Tracking has two distinct views so published history is never mixed into active work:

1. **Active work:** Pending, Pending Edits, RTP, and Scheduled. Use one sortable table without pagination for now. Put tasks with no assigned Author in their own group at the top. Then group assigned tasks by team in this order: Buyer's Guide, Car and Driver, Freelancers; sort Authors alphabetically within each team. Within each Author, dated tasks sort by nearest Deadline first, followed by tasks without a Deadline in alphabetical vehicle order. Status remains visible and available for filtering or alternate sorting. Show Notes inline here, but omit Notes from Published History. For now, when a note exceeds 50 characters, show a 30-character preview and a “see more” option for the full note.
2. **Published history:** Published and Updated entries together in one chronological list. Do not split Published and Updated into separate lists. Show a clear label to distinguish **Newly Published** from **Updated**, but treat both as one timeline. This view is paginated with 25 entries per page by default. Filters: Make, Model, Model Year, Author/team, Newly Published vs. Updated, and publication date range.

When a user moves a task into Published or Updated, it leaves Active Work and appears in Published History. Sort Published History newest-first.

First-release Active Work filters: Make, Model, Model Year, Segment, Author/team, Status, New MMP/Update, and Deadline. Keep text search available as well. Users can combine filters.

### Creating a new task

New work originates directly on Publication Tracking. It does not need a Changeover entry; concept-car MMPs are one example of work that may not be tracked in Changeover.

The user selects Make, Model, and Model Year from separate database-backed lists. Segment is derived automatically from the selected vehicle/model. If the vehicle is not in the database yet, the user must add it before creating the MMP task.

Required task fields:

- Make
- Model
- Model Year
- Segment (auto-populated from the vehicle record)

Optional task fields:

- Author
- Embargo time
- Deadline
- Status
- Resources, such as links to press materials
- Notes about vehicle changes, including “no changes” or “no changes expected”

### Task resources

Keep the iMeet work-folder URL as its own dedicated task link. A task may also have multiple material links (for example, press materials). A material link may include an optional password when the destination is protected. Store the password with its material link, not as general task notes. Passwords are visible to editors only; view-only users cannot see them.

Show Notes inline with the 30-character preview / 50-character threshold above, then provide “see more” to reveal the full note in a tooltip/popover. Show a dedicated resource-folder icon: gray and disabled when there are no resources, black and clickable when resources exist; clicking it opens the resource list. Editors add and edit resources through the Add New Task/Edit Task forms, not through the folder icon.

Every new task starts as **Pending**, whether or not an Author is assigned. Author assignment and status remain independent throughout the task; changing or removing an Author does not automatically change Status.

## 2. Model-Year Changeover

Each model year has a master inventory of vehicles that may need an MMP. The 2027 workbook sheet includes Make, Model, Status, Author, URL, “Double-check info?”, and Make Tags. In the app, keep the existing Changeover statuses and add **Embargoed**: **Awaiting Info, Info Available, Skipped, Dead, Vaporware, Published, and Embargoed**. Normalize capitalization in imported values. **Embargoed** is a separate manual Changeover status; it is not derived from a Publication Tracking task's Scheduled status or embargo time. Free-text cells contain research notes and links; some records are not expected to receive a page. Drop Make Tags from the app. “Double-check info?” lives in Page Audit: it flags an MMP published before official information is available, based on the “What’s New” section, so the team can verify later in the year whether changes were made.

Editors may manually add vehicles to an existing model-year Changeover list at any time, outside the annual preparation flow. Select from the shared Make/Model/Model Year catalog; if the vehicle is new, add it to the catalog first.

When a Publication Tracking task is published or updated, sync the matching model-year Changeover row to **Published**. Page Audit uses the live URL from the shared model-year vehicle record. This status sync is one-way: an Editor may manually change the Changeover status, and that change does not change the Publication Tracking task. A date-stamped publication/update history could be added later if the team wants that context in Page Audit.

### Annual list roll-forward

Today this list is compiled manually early in the year; nothing is generated automatically. During compilation, the team combines three sources:

1. Start with the current model year's Changeover sheet and include every vehicle whose status is not Dead. Treat capitalization variants of Dead consistently; other statuses (including Skipped and vaporware) remain included.
2. Compare that list with the current model year's Page Audit. Add any audited vehicles missing from Changeover as a completeness check; normally there should be none.
3. Add vehicles from the next model year's Page Audit that may already have been published.

The preferred app feature is an Editor-triggered **Prepare Next Model Year** action that prepares a draft Changeover from these sources, shows where each entry came from, and supports review and reconciliation. An Editor must explicitly promote the reviewed draft to make it the active working list. Promotion switches the default Changeover year to the new model year; prior years remain accessible and editable. Prepare one next-year list at a time; multi-year future planning (for example, simultaneous 2029 and 2030 outlooks) is out of the initial scope. Merge matching Make/Model/Model Year entries into one row, retaining source provenance and flagging conflicting details for review. On generation, initialize each row's status to **Published** if the page already exists, otherwise **Awaiting Info**; do not carry forward the source sheet's status.

The app should support a distinct Changeover view for each model year, with assignment and research context. Include both summary counts and deadline pacing:

- **Total Open** counts rows whose Author is `OPEN`.
- Show counts for Published, Awaiting Info, Info Available, Embargoed, Skipped, Dead, and Vaporware. The workbook calculates shares for the four production statuses (Published, Awaiting Info, Info Available, Embargoed) against those four combined, and shares for Skipped, Dead, and Vaporware against all seven statuses.
- Show full weeks and remaining days until the model-year Changeover deadline.
- Show the rounded-up MMPs-per-week pace required to clear Awaiting Info, Info Available, and Embargoed items by the deadline, using fractional weeks remaining.

Set the Changeover deadline as an editable setting for each model year. The source workbook hard-codes a different deadline date in each model-year sheet. The 2027 sheet's Skipped count starts at row 10 while data starts at row 9; treat this as a source formula off-by-one and count all Changeover records in the app.

## 3. Page Audit

Page Audit is a separate, year-specific checklist view connected to the shared Make/Model/Model Year record. It may show the published page's URL read-only from the shared vehicle-year record; unpublished pages have no URL, and the audit is not used for resources. It does not repeat the Publication Tracking task's Published/Updated status; a date-stamped history may be useful later if the team wants publication events in the audit view.

The first app checklist follows the 2026–2029 workbook tabs. The 10 Best and Editors' Choice fields are kept separately in one Awards column and do not affect checklist scoring; show the supplied award icon only when its value is Yes. A check passes on the agreed expected answer: Yes for the Yes checks, Dual galleries, Actual pricing, the current model year in Gallery Model Year, or a numeric C/D rating from 0 through 10. Any N/A and any non-current Gallery Model Year are yellow exceptions; other answers that miss the expected value are red. The table shows the workbook's free-form answers, page status, author names, auditor initials, audit date, and shared live URL. The Editor can set **Double-check info** for pages published before official information is available, then revisit them later in the year. Additional findings go in Audit Notes.

The app imports the 2026–2029 audit rows as a starting point. Existing imported rows are never overwritten by rerunning the seed. Editors can add another shared-catalog vehicle to a year and edit its audit. The audit form does not accept or edit a URL; it only displays the shared URL when a published page has one.

The checklist summary reports pass, review, and needs-work counts separately; it does not reduce them to a single done state. Evidence uploads, repeat-audit history, and audit change history remain future decisions.

## Suggested app relationship

```text
Model (make + model + segment mapping)
  └─ Model-Year Vehicle (annual inventory / Changeover state)
       ├─ Production Work (new MMP lifecycle)
       ├─ Published Page (live URL and published state)
       │    ├─ Update Events (later changes to the existing page)
       │    └─ Audit Runs (year/version-specific checklist responses)
       └─ Research notes and source links
```

This is a design proposal, not a description of the existing code or a final schema. It gives each workflow its own view while allowing shared vehicle identity and page history.

## Questions for the process walkthrough

- Who can assign work, publish, and close an audit? Status changes can be made by anyone on the team; authors usually perform the Pending Edits handoff, with team members covering freelancers without app access.
- Should adding a new Make/Model/Model Year be available to everyone who can create tasks, or restricted to reference-data editors?
- Does “Pending Edits” mean an author has finished writing, or that an editor owns the next step? Is approval explicit?
- What does RTP mean in the team's day-to-day use, and what must be complete before a page enters RTP?
- If the iMeet location changes, replace the current URL; do not retain the previous URL in task history.
- Can a vehicle have multiple MMP tasks or published URLs in one model year? How are trims, hybrids, EV variants, and renamed models represented?
- When does a Changeover row become publication work? Can it be skipped, revived, or deferred to a later year?
- Does a Page Audit attach to a published URL, a specific page revision, or both? Can it be rerun, and should older answers remain visible?
- Which audit checks are required, conditional, or optional? Which need notes, proof, or follow-up tasks?
- What resources are commonly attached to a task, and do they need uploaded files, links, or both?
- How do simultaneous edits work today, and what should happen if two people edit the same item?
- Which views/actions need to be faster than the spreadsheet, and what response time feels fast enough?
