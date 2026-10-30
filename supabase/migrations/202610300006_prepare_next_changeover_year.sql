-- Track annual Changeover preparation and provide Editor-only prepare/promote/discard actions.
alter table public.model_years
  add column if not exists prepared_from_year smallint
  references public.model_years(year) on delete set null;

create or replace function public.prepare_next_changeover_year(p_current_year smallint)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_next_year smallint := p_current_year + 1;
  v_current_state public.changeover_year_state;
  v_current_default boolean;
  v_next_state public.changeover_year_state;
  v_prepared_from smallint;
  v_created integer := 0;
begin
  if not public.is_editor() then
    raise exception 'Only Editors can prepare a Changeover year.';
  end if;

  perform pg_advisory_xact_lock(3471, p_current_year::integer);

  select state, is_default
    into v_current_state, v_current_default
    from public.model_years
   where year = p_current_year
   for update;
  if not found or v_current_state <> 'active' or not v_current_default then
    raise exception 'Prepare the next list from the active Changeover year.';
  end if;

  insert into public.model_years (year, state)
  values (v_next_year, 'draft')
  on conflict (year) do nothing;

  select state, prepared_from_year
    into v_next_state, v_prepared_from
    from public.model_years
   where year = v_next_year
   for update;
  if v_next_state <> 'draft' then
    raise exception 'The next model year is not a draft year.';
  end if;
  if v_prepared_from is not null then
    raise exception 'This next-year draft was already prepared from %.', v_prepared_from;
  end if;

  -- Make target-year vehicle records for every source vehicle. Preserve a target-year
  -- segment when it already exists; otherwise carry forward the current-year segment.
  with vehicle_sources as (
    select v.model_id, v.segment_id, 1 as priority
      from public.changeover_entries c
      join public.model_year_vehicles v on v.id = c.model_year_vehicle_id
     where v.model_year = p_current_year and c.status <> 'dead'
    union all
    select v.model_id, v.segment_id, 2
      from public.page_audit_entries a
      join public.model_year_vehicles v on v.id = a.model_year_vehicle_id
     where v.model_year = p_current_year
       and not exists (
         select 1 from public.changeover_entries dead_entry
         join public.model_year_vehicles dead_vehicle on dead_vehicle.id = dead_entry.model_year_vehicle_id
          where dead_vehicle.model_year = p_current_year
            and dead_vehicle.model_id = v.model_id
            and dead_entry.status = 'dead'
       )
    union all
    select v.model_id, v.segment_id, 0
      from public.page_audit_entries a
      join public.model_year_vehicles v on v.id = a.model_year_vehicle_id
     where v.model_year = v_next_year
  ), preferred_segments as (
    select distinct on (model_id) model_id, segment_id
      from vehicle_sources
     order by model_id, priority
  )
  insert into public.model_year_vehicles (model_id, model_year, segment_id)
  select model_id, v_next_year, segment_id from preferred_segments
  on conflict (model_id, model_year) do nothing;

  with current_changeover as (
    select vehicle.model_id, entry.status
      from public.changeover_entries as entry
      join public.model_year_vehicles as vehicle
        on vehicle.id = entry.model_year_vehicle_id
     where vehicle.model_year = p_current_year
       and entry.status <> 'dead'
  ), current_audit as (
    select v.model_id
      from public.page_audit_entries a
      join public.model_year_vehicles v on v.id = a.model_year_vehicle_id
     where v.model_year = p_current_year
       and not exists (
         select 1 from public.changeover_entries dead_entry
         join public.model_year_vehicles dead_vehicle on dead_vehicle.id = dead_entry.model_year_vehicle_id
          where dead_vehicle.model_year = p_current_year
            and dead_vehicle.model_id = v.model_id
            and dead_entry.status = 'dead'
       )
  ), next_audit as (
    select v.model_id
      from public.page_audit_entries a
      join public.model_year_vehicles v on v.id = a.model_year_vehicle_id
     where v.model_year = v_next_year
  ), source_models as (
    select model_id from current_changeover
    union select model_id from current_audit
    union select model_id from next_audit
  ), merged as (
    select v.id as vehicle_id,
           v.model_id,
           nullif(btrim(v.public_url), '') is not null as has_public_url,
           cc.status = 'vaporware'::public.changeover_status as was_vaporware,
           jsonb_build_array(jsonb_build_object(
             'annual_roll_forward', true,
             'from_year', p_current_year,
             'sources', array_remove(array[
               case when cc.model_id is not null then 'changeover' end,
               case when ca.model_id is not null then 'current_page_audit' end,
               case when na.model_id is not null then 'next_page_audit' end
             ], null)
           )) as source_provenance
      from source_models sm
      join public.model_year_vehicles v on v.model_id = sm.model_id and v.model_year = v_next_year
      left join current_changeover cc on cc.model_id = sm.model_id
      left join current_audit ca on ca.model_id = sm.model_id
      left join next_audit na on na.model_id = sm.model_id
  )
  insert into public.changeover_entries as existing (
    model_year_vehicle_id, status, assigned_author_id, notes, source_provenance, needs_review
  )
  select vehicle_id,
         case when has_public_url then 'published'::public.changeover_status
              when coalesce(was_vaporware, false) then 'vaporware'::public.changeover_status
              else 'awaiting_info'::public.changeover_status end,
         null, '', source_provenance, false
    from merged
  on conflict (model_year_vehicle_id) do update set
    status = excluded.status,
    assigned_author_id = null,
    notes = case when existing.notes = '' then excluded.notes else existing.notes end,
    source_provenance = existing.source_provenance || excluded.source_provenance,
    needs_review = false;
  get diagnostics v_created = row_count;

  update public.model_years
     set prepared_from_year = p_current_year
   where year = v_next_year;

  return jsonb_build_object(
    'currentYear', p_current_year,
    'nextYear', v_next_year,
    'createdOrMerged', v_created
  );
end;
$$;

create or replace function public.promote_changeover_year(p_year smallint)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_prepared_from smallint;
  v_state public.changeover_year_state;
begin
  if not public.is_editor() then
    raise exception 'Only Editors can promote a Changeover year.';
  end if;

  select prepared_from_year, state into v_prepared_from, v_state
    from public.model_years where year = p_year for update;
  if not found or v_state <> 'draft' or v_prepared_from is null then
    raise exception 'Only a prepared draft can be promoted.';
  end if;

  perform 1 from public.model_years
   where year = v_prepared_from and state = 'active' and is_default
   for update;
  if not found then
    raise exception 'The source year is no longer the active default year.';
  end if;

  update public.model_years set state = 'prior', is_default = false where is_default;
  update public.model_years set state = 'active', is_default = true where year = p_year;
  return jsonb_build_object('promotedYear', p_year, 'previousYear', v_prepared_from);
end;
$$;

create or replace function public.discard_prepared_changeover_year(p_year smallint)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_state public.changeover_year_state;
  v_prepared_from smallint;
  v_removed integer := 0;
begin
  if not public.is_editor() then
    raise exception 'Only Editors can discard a prepared Changeover draft.';
  end if;

  select state, prepared_from_year into v_state, v_prepared_from
    from public.model_years where year = p_year for update;
  if not found or v_state <> 'draft' or v_prepared_from is null then
    raise exception 'Only a prepared draft can be discarded.';
  end if;

  delete from public.changeover_entries c
   using public.model_year_vehicles v
   where c.model_year_vehicle_id = v.id and v.model_year = p_year;
  get diagnostics v_removed = row_count;

  update public.model_years
     set prepared_from_year = null
   where year = p_year;

  return jsonb_build_object('discardedYear', p_year, 'removedEntries', v_removed, 'sourceYear', v_prepared_from);
end;
$$;

revoke all on function public.prepare_next_changeover_year(smallint) from public;
revoke all on function public.promote_changeover_year(smallint) from public;
revoke all on function public.discard_prepared_changeover_year(smallint) from public;
grant execute on function public.prepare_next_changeover_year(smallint) to authenticated;
grant execute on function public.promote_changeover_year(smallint) to authenticated;
grant execute on function public.discard_prepared_changeover_year(smallint) to authenticated;

-- Repair a just-prepared draft created before current-year Dead rows were excluded.
-- Entries created in the same transaction as the draft preparation have the same
-- timestamp as the model_years update; older manual target-year entries are spared.
delete from public.changeover_entries c
using public.model_year_vehicles target_vehicle,
      public.model_years target_year,
      public.model_year_vehicles source_vehicle,
      public.changeover_entries source_entry
where c.model_year_vehicle_id = target_vehicle.id
  and target_vehicle.model_year = target_year.year
  and target_year.state = 'draft'
  and target_year.prepared_from_year is not null
  and target_year.year = target_year.prepared_from_year + 1
  and c.created_at = target_year.updated_at
  and c.source_provenance @> '[{"annual_roll_forward": true, "sources": ["current_page_audit"]}]'::jsonb
  and source_entry.model_year_vehicle_id = source_vehicle.id
  and source_vehicle.model_year = target_year.prepared_from_year
  and source_vehicle.model_id = target_vehicle.model_id
  and source_entry.status = 'dead'
  and not exists (
    select 1 from public.page_audit_entries next_audit
    join public.model_year_vehicles next_vehicle on next_vehicle.id = next_audit.model_year_vehicle_id
    where next_vehicle.model_year = target_year.year
      and next_vehicle.model_id = target_vehicle.model_id
  );

-- Normalize the existing draft to the agreed defaults, clear assigned authors,
-- and remove source-review flags left by the earlier author-conflict workflow.
update public.changeover_entries as ce
   set status = case
     when nullif(btrim(target_vehicle.public_url), '') is not null
       then 'published'::public.changeover_status
     when exists (
       select 1 from public.changeover_entries source_entry
       join public.model_year_vehicles source_vehicle on source_vehicle.id = source_entry.model_year_vehicle_id
        where source_vehicle.model_year = target_year.prepared_from_year
          and source_vehicle.model_id = target_vehicle.model_id
          and source_entry.status = 'vaporware'
     ) then 'vaporware'::public.changeover_status
     else 'awaiting_info'::public.changeover_status
   end,
       assigned_author_id = null,
       needs_review = false
  from public.model_year_vehicles as target_vehicle
  join public.model_years as target_year on target_year.year = target_vehicle.model_year
 where ce.model_year_vehicle_id = target_vehicle.id
   and target_vehicle.model_year = target_year.year
   and target_year.state = 'draft'
   and target_year.prepared_from_year is not null
   and target_year.year = target_year.prepared_from_year + 1
   and ce.source_provenance @> '[{"annual_roll_forward": true}]'::jsonb;

-- Changeover notes describe that specific model year. Remove notes in the draft
-- that still match the source-year note; leave distinct target-year notes untouched.
update public.changeover_entries as ce
   set notes = ''
  from public.model_year_vehicles as target_vehicle
  join public.model_years as target_year on target_year.year = target_vehicle.model_year
  join public.model_year_vehicles as source_vehicle on source_vehicle.model_year = target_year.prepared_from_year
                                                and source_vehicle.model_id = target_vehicle.model_id
  join public.changeover_entries as source_entry on source_entry.model_year_vehicle_id = source_vehicle.id
 where ce.model_year_vehicle_id = target_vehicle.id
   and target_vehicle.model_year = target_year.year
   and target_year.state = 'draft'
   and target_year.prepared_from_year is not null
   and target_year.year = target_year.prepared_from_year + 1
   and ce.notes <> ''
   and ce.source_provenance @> '[{"annual_roll_forward": true}]'::jsonb
   and source_entry.status <> 'dead'
   and source_entry.notes = ce.notes;
