# Supabase setup

The initial schema is in `migrations/202610260001_initial_schema.sql`. It has
been applied to the new Supabase project for this app. Keep future schema
changes in versioned migrations.

For an existing project, run any newer migration files in `migrations/` in
filename order. The catalog Realtime migration adds Makes, Models, Segments,
Authors, and Model Years to the `supabase_realtime` publication. The next
migration stores Segment on each Make/Model/Year record and preserves any
existing model-level Segment values on current vehicle-year rows.

Page Audit uses `migrations/202610290001_page_audit.sql`. The follow-up
`migrations/202610300001_remove_derived_audit_state.sql` removes the app-invented
progress field and removes award values from checklist scoring. Then run
`migrations/202610300002_add_page_audit_awards.sql` to store the two awards separately
and restore the workbook's existing Yes values by model year. The follow-up
`migrations/202610300004_backfill_year_specific_awards.sql` safely fills any
year-specific awards missing after an earlier version of migration 300002. After
the Page Audit migrations, run
`seeds/page_audit.sql` to import the workbook's 2026–2029 audit rows. The
seed skips audit entries that already exist and only fills shared public URLs
that are blank. Only published-page URLs belong in that shared field; resource
and editor links are omitted from Page Audit. The query result reports source rows,
catalog matches, inserted audit rows, and shared URLs filled.

Run `migrations/202610300005_seed_double_check_info.sql` to populate **Needs Review**
from the 2026 and 2027 Changeover sheets. The Page Audit seed also carries these
flags forward for future imports; no seed rerun is needed for existing records.

Run `migrations/202610300003_separate_changeover_resource_urls.sql` to move links
from unpublished Changeover rows out of the shared published-page URL field and
into Changeover-only resource fields. This removes the Buick Envista resource
link from Page Audit while keeping it available as “Open resource” in Changeover.

Run `migrations/202610300006_prepare_next_changeover_year.sql` to enable the
Editor-only annual Changeover preparation and promotion workflow. The action
creates a next-year draft from the current Changeover list (excluding Dead),
the current Page Audit list (excluding vehicles marked Dead in Changeover), and
next-year Page Audit rows while excluding vehicles marked Dead in the current
Changeover year. Authors start unassigned. Statuses start as Published when a
public URL exists, Vaporware when the current-year row is Vaporware, and
Awaiting Info otherwise. Current-year notes and other statuses are not carried
forward. Re-running the updated migration repairs the existing 2028 draft. The
migration also adds an Editor-only discard action; it removes Changeover entries
and resets the draft for re-preparation while preserving shared vehicle, Page
Audit, and task records.

## Configure a project

1. Create a project in the existing Supabase account and keep its database
   password in a password manager.
2. For this project, the initial migration has already been reviewed and
   applied in the Supabase SQL Editor. Use versioned migrations for future
   schema changes.
3. Create the first Auth user, then promote that user's `profiles.role` to
   `editor` from the Supabase SQL Editor. New users receive the `viewer` role by
   default. Editors can manage roles after the first Editor is established.
4. In **Authentication → URL Configuration**, set the local development Site
   URL to `http://127.0.0.1:5173` and allow both
   `http://127.0.0.1:5173/**` and `http://localhost:5173/**`. Use the deployed
   app URL as the Site URL when production hosting is chosen. Resend an invite
   issued before this URL change so its link points to the app.
5. Copy `.env.example` to `.env.local` and set `VITE_SUPABASE_URL` and
   `VITE_SUPABASE_ANON_KEY` from the project's API settings. `.env.local` is
   ignored by Git. Do not put the service-role key in the client app or share it
   in chat.

The browser client uses the public anon key. Row Level Security policies in the
migration enforce Editor and Viewer access. Do not connect the application to
real data until the migration and policies have been reviewed in the project.
Invitation links return to the app, where invited users choose their initial
password before entering the workspace.

## Free-tier operating note

The Free plan is suitable for development and a small pilot, but it can pause
after a week of low activity and does not include automatic database backups.
Set up and verify regular off-site exports before using it as the only store for
production records.
