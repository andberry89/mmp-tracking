-- Initial shared schema for the MMP Tracking application.
-- Apply only to a new Supabase project after reviewing the schema.

create extension if not exists pgcrypto;

create type public.app_role as enum ('editor', 'viewer');
create type public.author_team as enum ('bg', 'cd', 'freelance');
create type public.task_status as enum (
  'pending',
  'pending_edits',
  'rtp',
  'scheduled',
  'published',
  'updated'
);
create type public.task_kind as enum ('new_mmp', 'update');
create type public.changeover_status as enum (
  'awaiting_info',
  'info_available',
  'skipped',
  'dead',
  'vaporware',
  'published',
  'embargoed'
);
create type public.changeover_year_state as enum ('draft', 'active', 'prior');
create type public.task_resource_kind as enum ('imeet', 'material');

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  role public.app_role not null default 'viewer',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.segments (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index segments_name_ci_idx on public.segments (lower(name));

create table public.makes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index makes_name_ci_idx on public.makes (lower(name));

create table public.models (
  id uuid primary key default gen_random_uuid(),
  make_id uuid not null references public.makes (id) on delete restrict,
  segment_id uuid references public.segments (id) on delete set null,
  name text not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index models_make_name_ci_idx on public.models (make_id, lower(name));

create table public.authors (
  id uuid primary key default gen_random_uuid(),
  first_name text not null,
  last_name text not null,
  label text not null,
  initials text not null,
  team public.author_team not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index authors_label_ci_idx on public.authors (lower(label));

create table public.model_years (
  year smallint primary key check (year between 1900 and 2200),
  changeover_deadline date,
  state public.changeover_year_state not null default 'draft',
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint model_year_default_must_be_active check (not is_default or state = 'active')
);
create unique index one_default_model_year_idx
  on public.model_years (is_default)
  where is_default;

-- A model/year may have an MMP task without appearing on a Changeover list.
-- The public URL lives here once and is shared by all app views.
create table public.model_year_vehicles (
  id uuid primary key default gen_random_uuid(),
  model_id uuid not null references public.models (id) on delete restrict,
  model_year smallint not null references public.model_years (year) on delete restrict,
  public_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (model_id, model_year)
);

create table public.changeover_entries (
  id uuid primary key default gen_random_uuid(),
  model_year_vehicle_id uuid not null unique
    references public.model_year_vehicles (id) on delete cascade,
  status public.changeover_status not null default 'awaiting_info',
  assigned_author_id uuid references public.authors (id) on delete set null,
  notes text not null default '',
  source_provenance jsonb not null default '[]'::jsonb,
  needs_review boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.mmp_tasks (
  id uuid primary key default gen_random_uuid(),
  model_year_vehicle_id uuid not null
    references public.model_year_vehicles (id) on delete restrict,
  author_id uuid references public.authors (id) on delete set null,
  status public.task_status not null default 'pending',
  task_kind public.task_kind not null default 'new_mmp',
  high_priority boolean not null default false,
  deadline date,
  notes text not null default '',
  embargo_at timestamptz,
  embargo_notes text not null default '',
  published_at timestamptz,
  created_by uuid references public.profiles (id) on delete set null,
  updated_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index mmp_tasks_status_updated_idx on public.mmp_tasks (status, updated_at desc);
create index mmp_tasks_model_year_vehicle_idx on public.mmp_tasks (model_year_vehicle_id);
create index mmp_tasks_author_deadline_idx on public.mmp_tasks (author_id, deadline);

create table public.task_resources (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.mmp_tasks (id) on delete cascade,
  kind public.task_resource_kind not null,
  label text not null default '',
  url text not null,
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index one_imeet_resource_per_task_idx
  on public.task_resources (task_id)
  where kind = 'imeet';
create index task_resources_task_id_idx on public.task_resources (task_id);

-- Kept separate so viewers cannot retrieve passwords along with resource links.
create table public.task_resource_secrets (
  resource_id uuid primary key references public.task_resources (id) on delete cascade,
  password text not null,
  updated_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.is_editor()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = (select auth.uid())
      and role = 'editor'
  );
$$;

create or replace function public.create_viewer_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, role)
  values (
    new.id,
    nullif(new.raw_user_meta_data ->> 'display_name', ''),
    'viewer'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.create_viewer_profile();

create or replace function public.set_publication_defaults()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.status in ('published', 'updated')
     and (tg_op = 'INSERT' or old.status not in ('published', 'updated'))
     and new.published_at is null then
    new.published_at = coalesce(new.embargo_at, now());
  end if;
  return new;
end;
$$;

create trigger mmp_task_publication_defaults
  before insert or update of status on public.mmp_tasks
  for each row execute procedure public.set_publication_defaults();

create or replace function public.sync_published_task_to_changeover()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.status in ('published', 'updated') then
    update public.changeover_entries
       set status = 'published', updated_at = now()
     where model_year_vehicle_id = new.model_year_vehicle_id;
  end if;
  return new;
end;
$$;

create trigger mmp_task_sync_changeover_publication
  after insert or update of status on public.mmp_tasks
  for each row execute procedure public.sync_published_task_to_changeover();

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'profiles', 'segments', 'makes', 'models', 'authors', 'model_years',
    'model_year_vehicles', 'changeover_entries', 'mmp_tasks', 'task_resources',
    'task_resource_secrets'
  ] loop
    execute format('create trigger %I_set_updated_at before update on public.%I for each row execute procedure public.set_updated_at()', table_name, table_name);
  end loop;
end;
$$;

alter table public.profiles enable row level security;
grant usage on schema public to authenticated;
alter table public.segments enable row level security;
alter table public.makes enable row level security;
alter table public.models enable row level security;
alter table public.authors enable row level security;
alter table public.model_years enable row level security;
alter table public.model_year_vehicles enable row level security;
alter table public.changeover_entries enable row level security;
alter table public.mmp_tasks enable row level security;
alter table public.task_resources enable row level security;
alter table public.task_resource_secrets enable row level security;

grant select, update on public.profiles to authenticated;
grant select, insert, update, delete on
  public.segments, public.makes, public.models, public.authors,
  public.model_years, public.model_year_vehicles, public.changeover_entries,
  public.mmp_tasks, public.task_resources, public.task_resource_secrets
to authenticated;

create policy "Users can read their profile; editors can read all profiles"
  on public.profiles for select to authenticated
  using (id = (select auth.uid()) or (select public.is_editor()));
create policy "Editors can manage profiles"
  on public.profiles for update to authenticated
  using ((select public.is_editor()))
  with check ((select public.is_editor()));

create policy "Authenticated users can read segments"
  on public.segments for select to authenticated using (true);
create policy "Editors can manage segments"
  on public.segments for all to authenticated
  using ((select public.is_editor())) with check ((select public.is_editor()));

create policy "Authenticated users can read makes"
  on public.makes for select to authenticated using (true);
create policy "Editors can manage makes"
  on public.makes for all to authenticated
  using ((select public.is_editor())) with check ((select public.is_editor()));

create policy "Authenticated users can read models"
  on public.models for select to authenticated using (true);
create policy "Editors can manage models"
  on public.models for all to authenticated
  using ((select public.is_editor())) with check ((select public.is_editor()));

create policy "Authenticated users can read authors"
  on public.authors for select to authenticated using (true);
create policy "Editors can manage authors"
  on public.authors for all to authenticated
  using ((select public.is_editor())) with check ((select public.is_editor()));

create policy "Authenticated users can read model years"
  on public.model_years for select to authenticated using (true);
create policy "Editors can manage model years"
  on public.model_years for all to authenticated
  using ((select public.is_editor())) with check ((select public.is_editor()));

create policy "Authenticated users can read model-year vehicles"
  on public.model_year_vehicles for select to authenticated using (true);
create policy "Editors can manage model-year vehicles"
  on public.model_year_vehicles for all to authenticated
  using ((select public.is_editor())) with check ((select public.is_editor()));

create policy "Authenticated users can read Changeover entries"
  on public.changeover_entries for select to authenticated using (true);
create policy "Editors can manage Changeover entries"
  on public.changeover_entries for all to authenticated
  using ((select public.is_editor())) with check ((select public.is_editor()));

create policy "Authenticated users can read MMP tasks"
  on public.mmp_tasks for select to authenticated using (true);
create policy "Editors can manage MMP tasks"
  on public.mmp_tasks for all to authenticated
  using ((select public.is_editor())) with check ((select public.is_editor()));

create policy "Authenticated users can read task resources"
  on public.task_resources for select to authenticated using (true);
create policy "Editors can manage task resources"
  on public.task_resources for all to authenticated
  using ((select public.is_editor())) with check ((select public.is_editor()));

create policy "Only editors can access resource passwords"
  on public.task_resource_secrets for all to authenticated
  using ((select public.is_editor())) with check ((select public.is_editor()));

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'model_year_vehicles', 'changeover_entries', 'mmp_tasks', 'task_resources'
  ] loop
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = table_name
    ) then
      execute format('alter publication supabase_realtime add table public.%I', table_name);
    end if;
  end loop;
end;
$$;
