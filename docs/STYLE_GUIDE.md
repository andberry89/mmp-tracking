# Styling Guide

This guide records the visual language already present in the prototype. Treat it as a baseline to confirm during product discovery, not as a final design contract.

## Current direction

- A compact editorial operations dashboard with a dark left sidebar, light header, and a spacious task workspace.
- Status is communicated with colored labels and dots.
- Task records use white cards with a subtle border and a stronger hover border.
- Use clear, dense information hierarchy; keep task metadata scannable.

## Typography

- **Asap** is the main interface and body typeface.
- **Monda** is used for prominent navigation and selected labels.
- These are currently loaded from Google Fonts in `src/styles/main.css`.

## Color tokens

The source of truth is `src/styles/tokens.css`. Prefer its CSS variables over hard-coded colors.

- Neutral palette: white and light gray content surfaces; charcoal logo and sidebar.
- Accent palette: blue, purple, orange, yellow, green, and teal.
- Status mapping: Pending—blue; Ready to Edit—purple; Ready to Publish—orange; Scheduled—yellow; Published—green; Updated—teal.
- Team accents: Buyer's Guide—indigo; Car and Driver—mint; Freelance—pink.

## Components and layout

- App shell: 175px sidebar column with a 100px header row (`src/App.vue`).
- Use shared primitives in `src/components/common/` and shared styles in `src/styles/` before introducing new patterns.
- Keep status colors consistent wherever a task status appears.
- Preserve visible labels and text alongside color cues.

## Task notes and resource affordances

- Show Notes inline, truncated after a defined character limit. Offer a clear “see more” action that opens the complete note in a tooltip/popover.
- Show a dedicated resources folder icon. When the task has no resources, render it gray and disabled. When resources exist, render it black/active and open a popover or modal listing the links.
- Keep the iMeet folder link distinct from other material links. Show resource passwords only to Editors.
- Keep the interaction compact so the main work list remains scannable; use the expanded surface for full notes and the resource list.

## Responsive behavior and accessibility

Responsive breakpoints, keyboard behavior, and contrast targets have not yet been defined. Establish these as part of the process and product requirements before treating the current desktop layout as final.

## To confirm

- Whether the dark sidebar, patterned workspace background, and current fonts are intentional long-term choices.
- Target devices and minimum supported viewport.
- Accessibility and contrast requirements.
- Whether status colors or team colors should match an existing organizational palette.
