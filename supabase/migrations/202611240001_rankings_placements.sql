-- Store annual Rankings membership separately from a vehicle's shared Catalog segments.
-- This allows (for example) a 2028 vehicle to appear in a 2027 Rankings segment.
create table public.rankings_placements (
  ranking_year smallint not null references public.model_years (year) on delete restrict,
  model_year_vehicle_id uuid not null references public.model_year_vehicles (id) on delete cascade,
  segment_id uuid not null references public.segments (id) on delete restrict,
  rank_position integer,
  entry_state public.ranking_entry_state not null default 'unranked',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (ranking_year, model_year_vehicle_id, segment_id),
  foreign key (model_year_vehicle_id, segment_id)
    references public.model_year_vehicle_segments (model_year_vehicle_id, segment_id)
    on delete cascade,
  constraint rankings_placements_rank_check
    check ((entry_state = 'ranked' and rank_position > 0)
      or (entry_state <> 'ranked' and rank_position is null))
);

create unique index rankings_placements_rank_idx
  on public.rankings_placements (ranking_year, segment_id, rank_position)
  where rank_position is not null;
create index rankings_placements_vehicle_idx
  on public.rankings_placements (model_year_vehicle_id);
create index rankings_placements_segment_year_idx
  on public.rankings_placements (segment_id, ranking_year);

-- Preserve all existing annual lists while moving their source of truth.
insert into public.rankings_placements
  (ranking_year, model_year_vehicle_id, segment_id, rank_position, entry_state)
select model_year, model_year_vehicle_id, segment_id, rank_position, entry_state
  from public.model_year_vehicle_segments
 where is_on_rankings_list
on conflict (ranking_year, model_year_vehicle_id, segment_id) do nothing;

alter table public.rankings_placements enable row level security;
grant select, insert, update, delete on public.rankings_placements to authenticated;
create policy "Authorized users can read Rankings placements"
  on public.rankings_placements for select to authenticated
  using ((select public.is_authorized_user()));
create policy "Editors can manage Rankings placements"
  on public.rankings_placements for all to authenticated
  using ((select public.is_editor()))
  with check ((select public.is_editor()));
create trigger rankings_placements_set_updated_at
  before update on public.rankings_placements
  for each row execute procedure public.set_updated_at();

create or replace function public.save_rankings_placement_order(
  p_ranking_year smallint,
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

  perform pg_advisory_xact_lock(hashtextextended(p_ranking_year::text || ':' || p_segment_id::text, 0));
  requested_count := coalesce(cardinality(p_vehicle_ids), 0);

  if (select count(distinct requested.vehicle_id)
        from unnest(coalesce(p_vehicle_ids, '{}'::uuid[])) as requested(vehicle_id)) <> requested_count
     or exists (
       select 1 from unnest(coalesce(p_vehicle_ids, '{}'::uuid[])) as requested(vehicle_id)
        where not exists (
          select 1 from public.rankings_placements as placement
           where placement.ranking_year = p_ranking_year
             and placement.segment_id = p_segment_id
             and placement.model_year_vehicle_id = requested.vehicle_id
        )
     ) then
    raise exception 'The ranked vehicle list changed. Refresh the Rankings view and try again.' using errcode = '40001';
  end if;

  update public.rankings_placements
     set rank_position = null,
         entry_state = case when entry_state = 'future' then 'future'::public.ranking_entry_state else 'unranked'::public.ranking_entry_state end
   where ranking_year = p_ranking_year and segment_id = p_segment_id and rank_position is not null;

  update public.rankings_placements as placement
     set rank_position = ordered.position::integer,
         entry_state = 'ranked',
         updated_at = now()
    from unnest(p_vehicle_ids) with ordinality as ordered(vehicle_id, position)
   where placement.ranking_year = p_ranking_year
     and placement.segment_id = p_segment_id
     and placement.model_year_vehicle_id = ordered.vehicle_id;
end;
$$;

create or replace function public.remove_rankings_placement(
  p_ranking_year smallint,
  p_vehicle_id uuid,
  p_segment_id uuid
)
returns void
language plpgsql
set search_path = public
as $$
declare
  v_ranked_vehicle_ids uuid[];
begin
  if not public.is_editor() then
    raise exception 'Editor access is required to change Rankings.' using errcode = '42501';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(p_ranking_year::text || ':' || p_segment_id::text, 0));

  select coalesce(array_agg(model_year_vehicle_id order by rank_position), '{}'::uuid[])
    into v_ranked_vehicle_ids
    from public.rankings_placements
   where ranking_year = p_ranking_year
     and segment_id = p_segment_id
     and rank_position is not null
     and model_year_vehicle_id <> p_vehicle_id;

  delete from public.rankings_placements
   where ranking_year = p_ranking_year
     and model_year_vehicle_id = p_vehicle_id
     and segment_id = p_segment_id;

  update public.rankings_placements
     set rank_position = null,
         entry_state = case when entry_state = 'future' then 'future'::public.ranking_entry_state else 'unranked'::public.ranking_entry_state end,
         updated_at = now()
   where ranking_year = p_ranking_year
     and segment_id = p_segment_id
     and rank_position is not null;

  update public.rankings_placements as placement
     set rank_position = ordered.position::integer,
         entry_state = 'ranked',
         updated_at = now()
    from unnest(v_ranked_vehicle_ids) with ordinality as ordered(vehicle_id, position)
   where placement.ranking_year = p_ranking_year
     and placement.segment_id = p_segment_id
     and placement.model_year_vehicle_id = ordered.vehicle_id;
end;
$$;

revoke all on function public.save_rankings_placement_order(smallint, uuid, uuid[])
  from public, anon;
grant execute on function public.save_rankings_placement_order(smallint, uuid, uuid[])
  to authenticated;
revoke all on function public.remove_rankings_placement(smallint, uuid, uuid)
  from public, anon;
grant execute on function public.remove_rankings_placement(smallint, uuid, uuid)
  to authenticated;

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
     and not exists (
       select 1 from pg_publication_tables
        where pubname = 'supabase_realtime'
          and schemaname = 'public'
          and tablename = 'rankings_placements'
     ) then
    alter publication supabase_realtime add table public.rankings_placements;
  end if;
end;
$$;
