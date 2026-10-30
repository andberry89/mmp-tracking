-- Optional Author association and editable user display names.
alter table public.profiles
  add column if not exists author_id uuid references public.authors (id) on delete set null;
alter table public.allowed_users
  add column if not exists display_name text,
  add column if not exists author_id uuid references public.authors (id) on delete set null;

update public.allowed_users allowed
   set display_name = coalesce(allowed.display_name, p.display_name),
       author_id = coalesce(allowed.author_id, p.author_id)
  from auth.users u
  join public.profiles p on p.id = u.id
 where allowed.email = lower(btrim(u.email))
   and (allowed.display_name is null or allowed.author_id is null);

create or replace function public.create_viewer_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role public.app_role;
  v_display_name text;
  v_author_id uuid;
begin
  select allowed.role, allowed.display_name, allowed.author_id
    into v_role, v_display_name, v_author_id
    from public.allowed_users allowed
   where allowed.email = lower(btrim(new.email))
     and allowed.active;
  if not found then
    raise exception 'This email is not approved for MMP Tracking.';
  end if;

  insert into public.profiles (id, display_name, role, author_id)
  values (
    new.id,
    coalesce(v_display_name, nullif(new.raw_user_meta_data ->> 'display_name', '')),
    v_role,
    v_author_id
  );
  return new;
end;
$$;

drop function public.list_allowed_users();
create function public.list_allowed_users()
returns table (
  email text,
  assigned_role public.app_role,
  active boolean,
  has_account boolean,
  invitation_pending boolean,
  display_name text,
  author_id uuid,
  author_label text
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
         (u.id is not null),
         (u.id is not null and u.invited_at is not null and u.email_confirmed_at is null),
         coalesce(p.display_name, allowed.display_name),
         coalesce(p.author_id, allowed.author_id), a.label
    from public.allowed_users allowed
    left join auth.users u on lower(btrim(u.email)) = allowed.email
    left join public.profiles p on p.id = u.id
    left join public.authors a on a.id = coalesce(p.author_id, allowed.author_id)
   order by coalesce(p.display_name, allowed.display_name, allowed.email);
end;
$$;

drop function public.save_allowed_user(text, public.app_role, boolean);
create function public.save_allowed_user(
  p_email text,
  p_role public.app_role,
  p_active boolean default true,
  p_display_name text default null,
  p_author_id uuid default null
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

  insert into public.allowed_users (email, role, active, display_name, author_id, created_by)
  values (v_email, p_role, p_active, nullif(btrim(p_display_name), ''), p_author_id, (select auth.uid()))
  on conflict (email) do update
    set role = excluded.role,
        active = excluded.active,
        display_name = excluded.display_name,
        author_id = excluded.author_id;

  update public.profiles p
     set role = p_role,
         display_name = nullif(btrim(p_display_name), ''),
         author_id = p_author_id
    from auth.users u
   where u.id = p.id and lower(btrim(u.email)) = v_email;
end;
$$;

revoke all on function public.list_allowed_users() from public;
revoke all on function public.save_allowed_user(text, public.app_role, boolean, text, uuid) from public;
grant execute on function public.list_allowed_users() to authenticated;
grant execute on function public.save_allowed_user(text, public.app_role, boolean, text, uuid) to authenticated;
