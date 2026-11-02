-- Restrict SECURITY DEFINER functions that are exposed through the public API.
-- Signed-in app calls remain available where needed; anonymous execution is removed.

revoke execute on function public.is_authorized_user()
  from public, anon;
revoke execute on function public.is_editor()
  from public, anon;
revoke execute on function public.create_viewer_profile()
  from public, anon, authenticated;
revoke execute on function public.list_allowed_users()
  from public, anon;
revoke execute on function public.save_allowed_user(
  text, public.app_role, boolean, text, uuid
) from public, anon;
revoke execute on function public.prepare_next_changeover_year(smallint)
  from public, anon;
revoke execute on function public.promote_changeover_year(smallint)
  from public, anon;
revoke execute on function public.discard_prepared_changeover_year(smallint)
  from public, anon;

-- Policies and authenticated RPCs call these helpers. Their implementations
-- enforce the allowlist / Editor checks before returning or changing data.
grant execute on function public.is_authorized_user() to authenticated;
grant execute on function public.is_editor() to authenticated;
grant execute on function public.list_allowed_users() to authenticated;
grant execute on function public.save_allowed_user(
  text, public.app_role, boolean, text, uuid
) to authenticated;
grant execute on function public.prepare_next_changeover_year(smallint)
  to authenticated;
grant execute on function public.promote_changeover_year(smallint)
  to authenticated;
grant execute on function public.discard_prepared_changeover_year(smallint)
  to authenticated;
