-- Fix role synchronization for existing Auth accounts.
-- `profiles` has no `active` column; access state lives on allowed_users.
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

revoke all on function public.save_allowed_user(text, public.app_role, boolean) from public;
grant execute on function public.save_allowed_user(text, public.app_role, boolean) to authenticated;
