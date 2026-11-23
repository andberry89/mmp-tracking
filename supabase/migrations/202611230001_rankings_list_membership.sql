-- Keep shared model-year segment assignments separate from annual Rankings membership.
-- Existing associations remain available to Catalog, Changeover, and Page Audit,
-- but a vehicle appears on Rankings only when an import or Editor marks it included.
alter table public.model_year_vehicle_segments
  add column if not exists is_on_rankings_list boolean not null default false;

drop index if exists public.model_year_vehicle_segments_rank_idx;
create unique index model_year_vehicle_segments_rank_idx
  on public.model_year_vehicle_segments (model_year, segment_id, rank_position)
  where rank_position is not null and is_on_rankings_list;

create or replace function public.save_model_year_segment_order(
  p_model_year smallint,
  p_segment_id uuid,
  p_vehicle_ids uuid[]
)
returns void
language plpgsql
set search_path = public
as $$
declare
  requested_count integer;
begin
  if not public.is_editor() then
    raise exception 'Editor access is required to change Rankings.' using errcode = '42501';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(p_model_year::text || ':' || p_segment_id::text, 0));

  requested_count := coalesce(cardinality(p_vehicle_ids), 0);

  if (select count(distinct vehicle_id) from unnest(coalesce(p_vehicle_ids, '{}'::uuid[])) as vehicle_id) <> requested_count
     or exists (
       select 1 from unnest(coalesce(p_vehicle_ids, '{}'::uuid[])) as vehicle_id
        where not exists (
          select 1 from public.model_year_vehicle_segments as entry
           where entry.model_year = p_model_year
             and entry.segment_id = p_segment_id
             and entry.model_year_vehicle_id = vehicle_id
             and entry.is_on_rankings_list
        )
     ) then
    raise exception 'The ranked vehicle list changed. Refresh the Rankings view and try again.' using errcode = '40001';
  end if;

  update public.model_year_vehicle_segments
     set rank_position = null,
         entry_state = case when entry_state = 'future' then 'future'::public.ranking_entry_state else 'unranked'::public.ranking_entry_state end
   where model_year = p_model_year
     and segment_id = p_segment_id
     and is_on_rankings_list
     and rank_position is not null;

  update public.model_year_vehicle_segments as entry
     set rank_position = ordered.position,
         entry_state = 'ranked',
         updated_at = now()
    from unnest(p_vehicle_ids) with ordinality as ordered(vehicle_id, position)
   where entry.model_year = p_model_year
     and entry.segment_id = p_segment_id
     and entry.is_on_rankings_list
     and entry.model_year_vehicle_id = ordered.vehicle_id;
end;
$$;

-- Keep the existing Editor-only RPC access policy.
revoke all on function public.save_model_year_segment_order(smallint, uuid, uuid[])
  from public, anon;
grant execute on function public.save_model_year_segment_order(smallint, uuid, uuid[])
  to authenticated;
