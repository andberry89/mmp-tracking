-- Keep Changeover row + shared URL edits and task duplication atomic.

create or replace function public.save_changeover_entry(
  p_entry_id uuid,
  p_model_year_vehicle_id uuid,
  p_status public.changeover_status,
  p_assigned_author_id uuid,
  p_notes text,
  p_resource_url text,
  p_public_url text,
  p_source_provenance jsonb
)
returns void
language plpgsql
set search_path = public
as $$
begin
  if not public.is_editor() then
    raise exception 'Only Editors can change Changeover entries.';
  end if;

  if p_entry_id is null then
    insert into public.changeover_entries (
      model_year_vehicle_id,
      status,
      assigned_author_id,
      notes,
      resource_url,
      source_provenance
    ) values (
      p_model_year_vehicle_id,
      p_status,
      p_assigned_author_id,
      coalesce(p_notes, ''),
      case when p_status = 'published' then null else nullif(btrim(p_resource_url), '') end,
      coalesce(p_source_provenance, '[]'::jsonb)
    );
  else
    update public.changeover_entries
       set status = p_status,
           assigned_author_id = p_assigned_author_id,
           notes = coalesce(p_notes, ''),
           resource_url = case when p_status = 'published' then null else nullif(btrim(p_resource_url), '') end,
           source_provenance = coalesce(p_source_provenance, '[]'::jsonb)
     where id = p_entry_id
       and model_year_vehicle_id = p_model_year_vehicle_id;

    if not found then
      raise exception 'The Changeover entry could not be found for this vehicle.';
    end if;
  end if;

  update public.model_year_vehicles
     set public_url = case when p_status = 'published' then nullif(btrim(p_public_url), '') else null end
   where id = p_model_year_vehicle_id;

  if not found then
    raise exception 'The shared model-year vehicle could not be found.';
  end if;
end;
$$;

create or replace function public.duplicate_mmp_task(p_task_id uuid)
returns uuid
language plpgsql
set search_path = public
as $$
declare
  v_new_task_id uuid;
begin
  if not public.is_editor() then
    raise exception 'Only Editors can duplicate tasks.';
  end if;

  insert into public.mmp_tasks (
    model_year_vehicle_id,
    author_id,
    status,
    task_kind,
    high_priority,
    deadline,
    notes,
    embargo_at,
    embargo_notes
  )
  select
    model_year_vehicle_id,
    author_id,
    'pending',
    'new_mmp',
    high_priority,
    deadline,
    notes,
    embargo_at,
    embargo_notes
  from public.mmp_tasks
  where id = p_task_id
  returning id into v_new_task_id;

  if v_new_task_id is null then
    raise exception 'The source task could not be found.';
  end if;

  insert into public.task_resources (task_id, kind, label, url, notes)
  select v_new_task_id, kind, label, url, notes
    from public.task_resources
   where task_id = p_task_id
     and kind = 'material';

  return v_new_task_id;
end;
$$;

revoke all on function public.save_changeover_entry(
  uuid, uuid, public.changeover_status, uuid, text, text, text, jsonb
) from public, anon;
revoke all on function public.duplicate_mmp_task(uuid) from public, anon;

grant execute on function public.save_changeover_entry(
  uuid, uuid, public.changeover_status, uuid, text, text, text, jsonb
) to authenticated;
grant execute on function public.duplicate_mmp_task(uuid) to authenticated;
