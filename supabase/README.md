# Supabase setup

The initial schema is in `migrations/202610260001_initial_schema.sql`. It is a
draft for a new project and has not been applied to a hosted database.

## Configure a project

1. Create a project in the existing Supabase account and keep its database
   password in a password manager.
2. Review and apply the initial migration in the Supabase SQL Editor, or use the
   Supabase CLI after linking this repository to the project.
3. Create the first Auth user, then promote that user's `profiles.role` to
   `editor` from the Supabase SQL Editor. New users receive the `viewer` role by
   default. Editors can manage roles after the first Editor is established.
4. Copy `.env.example` to `.env.local` and set `VITE_SUPABASE_URL` and
   `VITE_SUPABASE_ANON_KEY` from the project's API settings. `.env.local` is
   ignored by Git. Do not put the service-role key in the client app or share it
   in chat.

The browser client uses the public anon key. Row Level Security policies in the
migration enforce Editor and Viewer access. Do not connect the application to
real data until the migration and policies have been reviewed in the project.

## Free-tier operating note

The Free plan is suitable for development and a small pilot, but it can pause
after a week of low activity and does not include automatic database backups.
Set up and verify regular off-site exports before using it as the only store for
production records.
