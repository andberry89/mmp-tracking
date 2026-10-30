-- Page Audit checklist records attach to the shared model-year vehicle.
-- The live URL remains on model_year_vehicles so all views use one URL.

create type public.page_audit_state as enum ('not_started', 'in_progress', 'complete');

create table public.page_audit_entries (
  id uuid primary key default gen_random_uuid(),
  model_year_vehicle_id uuid not null unique
    references public.model_year_vehicles (id) on delete cascade,
  audit_state public.page_audit_state not null default 'not_started',
  page_status text not null default '',
  checklist jsonb not null default '{}'::jsonb,
  author_names text not null default '',
  auditor_initials text not null default '',
  audited_at date,
  double_check_info boolean not null default false,
  audit_notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index page_audit_entries_state_idx
  on public.page_audit_entries (audit_state, updated_at desc);

create trigger page_audit_entries_set_updated_at
  before update on public.page_audit_entries
  for each row execute procedure public.set_updated_at();

alter table public.page_audit_entries enable row level security;
grant select, insert, update, delete on public.page_audit_entries to authenticated;

create policy "Authenticated users can read Page Audit entries"
  on public.page_audit_entries for select to authenticated using (true);
create policy "Editors can manage Page Audit entries"
  on public.page_audit_entries for all to authenticated
  using ((select public.is_editor()))
  with check ((select public.is_editor()));

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
     and not exists (
       select 1 from pg_publication_tables
       where pubname = 'supabase_realtime'
         and schemaname = 'public'
         and tablename = 'page_audit_entries'
     ) then
    alter publication supabase_realtime add table public.page_audit_entries;
  end if;
end;
$$;
