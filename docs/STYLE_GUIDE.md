# Styling Guide

This is the working visual baseline for the MMP tracking page. It captures its recognizable choices and the first refinement pass so new screens can feel related. Review it with the team before treating it as a final design contract.

## Visual character

- The page reads as a compact editorial production workboard: task information and status are meant to be scanned quickly.
- The shell pairs a charcoal left sidebar with a light navigation header and a warm, light task canvas. The canvas uses a faint repeating texture (`src/assets/bg-pattern.jpeg`).
- The interface favors compact spacing, strong text labels, simple controls, and a few bright colors for status and action cues.
- The shell has a fine neutral outline and soft shadow; cards use restrained borders and hover elevation rather than heavy outlines.
- Keep that practical, publication-workflow feel as the foundation. Refine the details deliberately so the product has character without making the work list harder to scan.

## Page layout and hierarchy

- **Application shell:** a charcoal MMP monogram and sidebar occupy the left column; the header and current page occupy the right. The refined desktop grid uses a 220px sidebar and an 82px header row inside a softly framed shell (`src/App.vue`).
- **Top navigation:** prominent Monda tabs identify the primary MMPs and Catalog views. The active tab uses darker text and a sliding green underline.
- **Catalog navigation:** Makes, Models, Segments, and Authors remain distinct sections under Catalog, shown in a compact secondary navigation row.
- **Sidebar:** groups author counts, quick status totals, and Published & Updates counts. Uppercase headings and compact rows make it an at-a-glance summary rail.
- **Page header:** the page title sits opposite search, filters, sort, and other page-level controls. A fine divider separates this toolbar from the working list.
- **Tracking list:** column labels sit above a dashed “Add New Task” row, followed by status-group headings and task rows. Task fields are aligned in a dense grid so vehicles, deadlines, status, dates, notes, assets, and authors can be compared across rows.
- **Catalog:** Makes, Models, Segments, and Authors share a persistent secondary navigation bar with a moving green underline. Keep transitions in the content below that bar. Use the same compact title, search/filter controls, and add action; show active state with a small green or red indicator. Model and Make detail views should keep related records easy to scan.
- **Changeover:** Start with the model-year controls and compact status/deadline summary cards, then show the searchable and sortable list. Make and model lead each row, with the status color fading diagonally into that first cell. Default to Make then Model sorting; status grouping is optional.
- **Page Audit:** Keep the vehicle/segment cell and column header row frozen while the wide checklist scrolls. Use the workbook-like table layout and restrained green/yellow/red cell fills to show checklist results. Keep row editing in the frozen vehicle cell.
- **Sign-in and dialogs:** use a solid warm-light canvas, white surface, charcoal typography, muted-green primary action, and neutral outline. Keep the repeating texture on the main tracking canvas. Account-help links use the green accent; reserve red for errors and destructive actions.
- Preserve a clear distinction between page-level controls, the list’s column labels, task rows, and status-group headings when extending this layout.

## Typography

- **Asap** is the main interface typeface for task data, body copy, and most controls.
- **Monda** is used for prominent top navigation and selected compact summary labels.
- Both are currently imported from Google Fonts in `src/styles/main.css`.
- Use weight and size to establish hierarchy. The page relies on bold headings and labels, with smaller regular text for dense supporting information.

## Color system

`src/styles/tokens.css` is the source of truth. Use its CSS custom properties instead of adding new hard-coded color values.

| Role | Current treatment |
| --- | --- |
| Main canvas and header | Warm light gray and white |
| Sidebar and logo area | Charcoal (`--gray-dark-4: #333333`, with related dark grays) |
| Primary action and active navigation | Muted green (`--green-2: #94bf69`) |
| Pending | Blue (`--blue: #45b8d3`) |
| Ready to Edit | Purple (`--purple: #c750fd`) |
| Ready to Publish | Orange (`--orange: #ed7356`) |
| Scheduled | Yellow (`--yellow: #eab02f`) |
| Published | Green (`--green: #6ac742`) |
| Updated | Teal (`--teal: #42c79f`) |
| Author team markers | Indigo for Buyer’s Guide, mint for Car and Driver, pink for Freelancers |

- Status and team colors are cues attached to text or other information; do not make color the only way to understand a state.
- Reserve the muted green for active navigation and primary add actions. Keep the wider, brighter palette tied to statuses and team identity.
- Use thin neutral borders, small corner radii, and soft shadows to give surfaces definition without making the dense workboard feel heavy.
- Maintain legible text contrast on both the light canvas and charcoal sidebar.

## Task-row interactions

- **Notes:** show a useful inline preview. When a note exceeds the chosen limit, offer a visible “See more” interaction that reveals the full note in a tooltip or popover.
- **Resources:** use a dedicated folder affordance. It is visually disabled when there are no resources and active when resources exist; activating it shows the task’s links in a compact expanded surface.
- Keep the iMeet link distinguishable from supporting materials. Resource passwords are visible to Editors only.
- Keep row actions secondary to task identity and status so the list remains easy to scan.

## Shared implementation rules

- Check `src/styles/tokens.css`, `src/styles/base.css`, `src/styles/utilities.css`, and `src/styles/typography.css` before adding another visual convention.
- Prefer shared primitives in `src/components/common/` for recurring modals, menus, and controls.
- Reuse the shared search, filter, form-control, and button treatments; use red for destructive actions and green for primary actions.
- Reuse the status and team mappings in `src/constants/constants.ts` and `src/constants/task-style-maps.ts` wherever those values appear.
- Keep spacing and alignment consistent with the compact task-row rhythm. Give forms and detail surfaces enough breathing room to remain readable while using the same typography, neutral surfaces, borders, and action accent.
- Include labels with colored indicators, and provide visible focus and usable keyboard interactions for controls.

## Responsive behavior and known gaps

- The shell now stacks its navigation and summary rail at narrow widths. The dense task grid still needs visual review at desktop and smaller widths, including confirmation of its minimum useful viewport.
- Contrast targets, keyboard interaction details, and reduced-motion behavior still need explicit review.
- Keep refining newer screens against the shared green/neutral tokens. In particular, avoid using destructive red as a general link-hover color.
- The current shell dimensions, typography scale, and patterned canvas are provisional choices. Confirm whether they should remain the long-term direction.

## Remaining review points

- Confirm the minimum viewport and how the dense tracking list should behave on smaller screens.
- Review contrast and keyboard focus for status, team, and checklist colors during the responsive/accessibility pass.
- Confirm whether the current density remains comfortable once the most current workbook is loaded.
