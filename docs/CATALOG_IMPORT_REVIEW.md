# Catalog Import Review

Working review of reference data in `MMP Tracking and Daily Audits.xlsx`. This is a reconciliation aid, not an import file.

## Segment selection

- Use the newest dated Publication Tracking row for each Make/Model/Model Year.
- Normalize the Make alias `Chevy` to `Chevrolet` before deduplication. Of 378 case-normalized Make/Model/Year combinations with conflicting Segment values, each has a dated newest row and no tie at that newest date. This gives a deterministic source choice without relying on worksheet position.
- The workbook contains 3,119 distinct numeric Make/Model/Model Year combinations from Publication Tracking.
- Six non-numeric Model Year labels are excluded from the initial year list until clarified: `2024?`, `2028 or 2029`, `2028?`, `2028? 2029?`, `2029?`, and `` ` ``.
- The seed draft combines Publication Tracking with all numeric-year Changeover and Page Audit sheets: 71 Makes, 1,126 Models, 147 Segments, 15 numeric Model Years, and 4,873 Make/Model/Year records. It sets 2027 as the default active year only if no default year is already set.
- The additional 1,758 Changeover/Page Audit-only vehicle-year records have no source Segment and are left blank. One tracked row, Genesis G90 (2027), has the apparent typo `Full-size Luxuy Cars`; the seed corrects it to the existing `Full-Size Luxury Cars` label.
- Segment spelling variants that differ only by case are folded to the most common capitalization. No tasks, public URLs, resources, notes, or passwords are included in the seed.

## Confirmed active Author roster

The project owner supplied the canonical names and teams below. Aliases from the Publication Tracking Author column should map to these records; aliases not in the list are excluded from active assignment.

| Author | Team | Tracking aliases |
| --- | --- | --- |
| Alayna Wilkening | Freelancers | Alayna |
| Austin Irwin | Car and Driver | Irwin |
| Austin Parsons | Buyer’s Guide | Austin; Parsons |
| Becca Hackett | Car and Driver | Becca |
| Beth Nichols | Freelancers | Beth; Nichols |
| Caleb Miller | Car and Driver | Caleb |
| Rich Ceppos | Buyer’s Guide | Ceppos; Rich |
| Clifford Atiyeh | Freelancers | Cliff |
| Drew Dorian | Buyer’s Guide | Dorian; Drew |
| Mike Duff | Freelancers | Duff |
| Elana Scherr | Car and Driver | Elana |
| Eric Stafford | Car and Driver | Eric; Stafford |
| Ezra Dyer | Car and Driver | Ezra |
| David Gluckman | Freelancers | Gluckman |
| Greg Fink | Car and Driver | Greg |
| Jack Fitzgerald | Car and Driver | Jack |
| Jacob Kurowicki | Car and Driver | Jacob |
| Joey Capparella | Buyer’s Guide | Joey |
| Andrew Krok | Car and Driver | Krok |
| Joe Lorio | Car and Driver | Lorio |
| Larry Printz | Freelancers | Printz |
| Jonathon Ramsey | Freelancers | Ramsay; Ramsey |
| Kristin Shaw | Freelancers | Shaw |
| Andy Wendler | Buyer’s Guide | Wendler |

Tracking values absent from the active roster are treated as inactive for assignment, per the project owner: `Frankie`, `Josh`, `Lassa`, `Lassa/Frugal`, `Mihir`, `Sasha`, `Takahashi`, `Warren`, and `Wender`. Do not seed these as active. Historical tasks using them will need an inactive author record with a confirmed team, or will remain unassigned. `Josh` and `Lassa/Frugal` have multiple or unclear candidate identities; `Lassa`, `Lassa/Frugal`, and `Wender` do not have an unambiguous canonical person in the supplied roster, so do not map those historical assignments automatically.

## Import boundaries

- Do not import multi-author Page Audit bylines as separate assigned Authors automatically; those cells can represent coauthors and the Page Audit workflow is still deferred.
- Do not import uncertain Model Year labels as numeric years without confirmation.
- Seed the active Author roster with `supabase/seeds/authors.sql`; the insert is safe to run again and skips existing records.
- After reviewing the exceptions above, seed the vehicle catalog with `supabase/seeds/catalog.sql`; it inserts missing records without overwriting existing catalog rows.
