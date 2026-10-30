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

Run `migrations/202610300007_user_access_management.sql` to enable the Editor
user-access panel. It backfills current Auth users and roles into an allowlist,
requires new invited emails to be allowlisted before Auth creates the account,
and applies the allowlist to app-data RLS policies. Editors approve an address
and select its role in the app, then use **Send invite** in that user's row.
The invitation is sent by `functions/send-user-invitation`; deploy that Edge
Function before using in-app invitations. It checks the sender's active Editor
role and the recipient's active allowlist record. The service-role key is used
only in the Edge Function environment and never in the browser.

Run `migrations/202610300008_fix_save_allowed_user.sql` after migration 007 to
correct the user-role synchronization function before approving or editing users.

Run `migrations/202610300009_user_identity.sql` after migration 008 to add
optional Author links and editable display names to app users. The Manage Users
panel suggests a display name for addresses matching `first.last@hearst.com`.

The invitation Edge Function uses the Supabase project's injected
`SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` environment
variables. The repository's `config.toml` keeps JWT verification enabled; the
function also checks the caller's active Editor role in the database. To deploy
from a machine with the Supabase CLI installed and linked, run
`supabase functions deploy send-user-invitation`. Supabase sends the configured
Auth invitation email and returns the recipient to the project's Site URL.

## Auth email templates

The branded invitation and password reset templates are in `templates/invite.html`
and `templates/recovery.html`. In the Supabase Dashboard, open **Authentication →
Email Templates**, select **Invite user** and **Reset password**, set their
subjects to **You're invited to MMP Tracking** and **Reset your MMP Tracking
password**, and paste the matching HTML file into each template's body. Keep
`{{ .ConfirmationURL }}` intact; the app relies on that URL to return invitees
and password-reset users to the configured Site URL.

This project is on Supabase Free and was created after the June 3, 2026 policy
change. With Supabase's default SMTP, Auth templates are read-only for new Free
projects, so the app currently uses Supabase's default invitation and recovery
emails. The branded templates above are optional drafts for a future custom
SMTP setup. The default mail service only sends to addresses on the Supabase
organization and is currently limited to two emails per hour; invitation and
password-reset emails to other addresses may be rejected or rate-limited.

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
## Workbook test data

The Publication Tracking and Status test import is split into numbered files in `seeds/publication_tracking_test_batches/` because the full query exceeds the Supabase SQL Editor size limit. Follow that folder's README and run batches `01` through `12` sequentially, then `13_resources_and_date_cleanup.sql`. Do this only in the non-production project, after `seeds/catalog.sql` and `seeds/authors.sql`. The current workbook's Changeover sheets and Page Audit sheets for 2026–2029 already have separate seed files and were imported earlier.

Across the batches are 5,581 importable task rows and 16 active-work links with stable IDs, so rerunning a completed batch does not duplicate its imported rows. The import preserves manually created test rows and does not delete or refresh data. It skips an active task when an exact matching vehicle/year/status/author/details task already exists. Six source rows with uncertain/non-numeric model years are skipped for review; workbook author values that do not match the confirmed active roster remain unassigned. No resource passwords are present in the import. Before launch, use the newer workbook the project owner provides to prepare a reviewed full refresh of tasks, current Changeover, and current Page Audit data.
