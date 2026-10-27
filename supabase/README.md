# Supabase setup

The initial schema is in `migrations/202610260001_initial_schema.sql`. It has
been applied to the new Supabase project for this app. Keep future schema
changes in versioned migrations.

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
