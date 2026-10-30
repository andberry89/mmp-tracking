-- Editor-managed allowlist for app accounts and roles.
create table public.allowed_users (
  email text primary key check (email = lower(btrim(email))),
  role public.app_role not null default 'viewer',
  active boolean not null default true,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger allowed_users_set_updated_at
  before update on public.allowed_users
  for each row execute procedure public.set_updated_at();

alter table public.allowed_users enable row level security;
revoke all on public.allowed_users from anon, authenticated;

-- Existing Auth users retain their current roles.
insert into public.allowed_users (email, role, active)
select lower(btrim(u.email)), p.role, true
  from auth.users u
  join public.profiles p on p.id = u.id
 where nullif(btrim(u.email), '') is not null
on conflict (email) do nothing;

create or replace function public.is_authorized_user()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
      from auth.users u
      join public.allowed_users allowed on allowed.email = lower(btrim(u.email))
     where u.id = (select auth.uid())
       and allowed.active
  );
$$;

create or replace function public.is_editor()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select (select public.is_authorized_user()) and exists (
    select 1 from public.profiles p
     where p.id = (select auth.uid()) and p.role = 'editor'
  );
$$;

-- An Auth invitation succeeds only when the email was allowlisted first.
create or replace function public.create_viewer_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role public.app_role;
begin
  select allowed.role into v_role
    from public.allowed_users allowed
   where allowed.email = lower(btrim(new.email))
     and allowed.active;
  if not found then
    raise exception 'This email is not approved for MMP Tracking.';
  end if;

  insert into public.profiles (id, display_name, role)
  values (new.id, nullif(new.raw_user_meta_data ->> 'display_name', ''), v_role);
  return new;
end;
$$;

create or replace function public.list_allowed_users()
returns table (
  email text,
  assigned_role public.app_role,
  active boolean,
  has_account boolean,
  display_name text
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_editor() then
    raise exception 'Only Editors can manage app users.';
  end if;

  return query
  select allowed.email, allowed.role, allowed.active,
         (u.id is not null), p.display_name
    from public.allowed_users allowed
    left join auth.users u on lower(btrim(u.email)) = allowed.email
    left join public.profiles p on p.id = u.id
   order by allowed.email;
end;
$$;

create or replace function public.save_allowed_user(
  p_email text,
  p_role public.app_role,
  p_active boolean default true
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text := lower(btrim(p_email));
  v_current_email text;
  v_was_active_editor boolean := false;
  v_active_editor_count integer := 0;
begin
  if not public.is_editor() then
    raise exception 'Only Editors can manage app users.';
  end if;
  if v_email is null or v_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then
    raise exception 'Enter a valid email address.';
  end if;
  if p_role is null or p_active is null then
    raise exception 'Choose a role and account state.';
  end if;

  select lower(btrim(u.email)) into v_current_email
    from auth.users u where u.id = (select auth.uid());
  if v_email = v_current_email and (p_role <> 'editor' or not p_active) then
    raise exception 'You cannot remove your own active Editor access.';
  end if;

  select allowed.role = 'editor' and allowed.active,
         (select count(*)::integer from public.allowed_users editors
           where editors.role = 'editor' and editors.active)
    into v_was_active_editor, v_active_editor_count
    from public.allowed_users allowed where allowed.email = v_email;
  if coalesce(v_was_active_editor, false)
     and (p_role <> 'editor' or not p_active)
     and v_active_editor_count <= 1 then
    raise exception 'At least one active Editor must remain.';
  end if;

  insert into public.allowed_users (email, role, active, created_by)
  values (v_email, p_role, p_active, (select auth.uid()))
  on conflict (email) do update
    set role = excluded.role, active = excluded.active;

  update public.profiles p
     set role = p_role
    from auth.users u
   where u.id = p.id and lower(btrim(u.email)) = v_email;
end;
$$;

revoke all on function public.is_authorized_user() from public;
revoke all on function public.list_allowed_users() from public;
revoke all on function public.save_allowed_user(text, public.app_role, boolean) from public;
grant execute on function public.is_authorized_user() to authenticated;
grant execute on function public.list_allowed_users() to authenticated;
grant execute on function public.save_allowed_user(text, public.app_role, boolean) to authenticated;

-- Role updates go through the Editor-only RPC, never a browser table update.
drop policy if exists "Editors can manage profiles" on public.profiles;
revoke update on public.profiles from authenticated;
grant update (display_name) on public.profiles to authenticated;
drop policy if exists "Users can read their profile; editors can read all profiles" on public.profiles;
create policy "Authorized users can read profiles"
  on public.profiles for select to authenticated
  using ((select public.is_authorized_user()) and (id = (select auth.uid()) or (select public.is_editor())));
create policy "Authorized users can update their display name"
  on public.profiles for update to authenticated
  using (id = (select auth.uid()) and (select public.is_authorized_user()))
  with check (id = (select auth.uid()) and (select public.is_authorized_user()));

-- Deactivated accounts lose data access even if they still hold an Auth session.
drop policy if exists "Authenticated users can read segments" on public.segments;
create policy "Authorized users can read segments" on public.segments for select to authenticated using ((select public.is_authorized_user()));
drop policy if exists "Authenticated users can read makes" on public.makes;
create policy "Authorized users can read makes" on public.makes for select to authenticated using ((select public.is_authorized_user()));
drop policy if exists "Authenticated users can read models" on public.models;
create policy "Authorized users can read models" on public.models for select to authenticated using ((select public.is_authorized_user()));
drop policy if exists "Authenticated users can read authors" on public.authors;
create policy "Authorized users can read authors" on public.authors for select to authenticated using ((select public.is_authorized_user()));
drop policy if exists "Authenticated users can read model years" on public.model_years;
create policy "Authorized users can read model years" on public.model_years for select to authenticated using ((select public.is_authorized_user()));
drop policy if exists "Authenticated users can read model-year vehicles" on public.model_year_vehicles;
create policy "Authorized users can read model-year vehicles" on public.model_year_vehicles for select to authenticated using ((select public.is_authorized_user()));
drop policy if exists "Authenticated users can read Changeover entries" on public.changeover_entries;
create policy "Authorized users can read Changeover entries" on public.changeover_entries for select to authenticated using ((select public.is_authorized_user()));
drop policy if exists "Authenticated users can read MMP tasks" on public.mmp_tasks;
create policy "Authorized users can read MMP tasks" on public.mmp_tasks for select to authenticated using ((select public.is_authorized_user()));
drop policy if exists "Authenticated users can read task resources" on public.task_resources;
create policy "Authorized users can read task resources" on public.task_resources for select to authenticated using ((select public.is_authorized_user()));
drop policy if exists "Only editors can access resource passwords" on public.task_resource_secrets;
create policy "Only authorized editors can access resource passwords"
  on public.task_resource_secrets for all to authenticated
  using ((select public.is_editor())) with check ((select public.is_editor()));
drop policy if exists "Authenticated users can read Page Audit entries" on public.page_audit_entries;
create policy "Authorized users can read Page Audit entries" on public.page_audit_entries for select to authenticated using ((select public.is_authorized_user()));
