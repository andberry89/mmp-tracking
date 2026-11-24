-- Temporary event tags belong to Active Work tasks only.
alter table public.mmp_tasks
  add column if not exists tags text[] not null default '{}'::text[];

create or replace function public.normalize_mmp_task_tags()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.status in ('published', 'updated') then
    new.tags := '{}'::text[];
    return new;
  end if;

  select coalesce(array_agg(tag order by ordinal), '{}'::text[])
    into new.tags
    from (
      select distinct on (lower(tag)) tag, ordinal
        from (
          select left(btrim(value), 50) as tag, ordinal
            from unnest(coalesce(new.tags, '{}'::text[])) with ordinality as tag_values(value, ordinal)
           where btrim(value) <> ''
        ) trimmed
       order by lower(tag), ordinal
    ) normalized;

  return new;
end;
$$;

drop trigger if exists mmp_tasks_normalize_event_tags on public.mmp_tasks;
create trigger mmp_tasks_normalize_event_tags
  before insert or update of status, tags on public.mmp_tasks
  for each row execute function public.normalize_mmp_task_tags();

revoke all on function public.normalize_mmp_task_tags() from public, anon, authenticated;

-- Duplicating an active task carries its event grouping forward. The duplicate
-- starts in Pending, so this migration's trigger retains those tags.
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
    embargo_notes,
    tags
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
    embargo_notes,
    tags
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

revoke all on function public.duplicate_mmp_task(uuid) from public, anon;
grant execute on function public.duplicate_mmp_task(uuid) to authenticated;
