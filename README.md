# MMP Tracking

MMP Tracking is an internal workspace for publication tracking, model-year Changeover lists, Page Audits, and shared vehicle and author catalogs.

## Local setup

```sh
npm install
cp .env.example .env.local
npm run dev
```

Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in `.env.local` to connect to the Supabase project. Without these values, the app starts in demo mode with local sample data. Never put a Supabase service-role key in a `VITE_*` variable or in browser code.

## Project commands

- `npm run dev` — start Vite's development server.
- `npm run build` — build the production bundle.
- `npm run preview` — serve the built bundle locally.
- `npm run type-check` — check Vue templates and TypeScript.
- `npm run lint` — report ESLint issues.

## Architecture

- Vue 3, TypeScript, Vite, and Pinia power the client app.
- Supabase Postgres, Auth, Row Level Security, and Realtime provide shared data and account access.
- Demo fixtures live under `src/test/`; they are used only when Supabase settings are absent.
- Supabase migrations, seed guidance, and Edge Function deployment notes live in `supabase/`.
- Product workflows and decisions are documented in `docs/`.

See [supabase/README.md](supabase/README.md) for project setup, migration order, seed instructions, and deployment notes.
