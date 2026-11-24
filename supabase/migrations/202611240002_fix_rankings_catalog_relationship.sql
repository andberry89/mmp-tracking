-- rankings_placements already references vehicles and segments directly.
-- Its extra composite FK to model_year_vehicle_segments created a second
-- PostgREST relationship path and made Catalog embeds ambiguous.
do $$
declare
  v_constraint_name text;
begin
  select constraint_row.conname
    into v_constraint_name
    from pg_constraint as constraint_row
   where constraint_row.conrelid = 'public.rankings_placements'::regclass
     and constraint_row.confrelid = 'public.model_year_vehicle_segments'::regclass
     and constraint_row.contype = 'f';

  if v_constraint_name is not null then
    execute format(
      'alter table public.rankings_placements drop constraint %I',
      v_constraint_name
    );
  end if;
end;
$$;

-- Keep the Catalog rule without exposing another FK relationship to PostgREST.
create or replace function public.validate_rankings_placement_catalog_segment()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if not exists (
    select 1
      from public.model_year_vehicle_segments as assignment
     where assignment.model_year_vehicle_id = new.model_year_vehicle_id
       and assignment.segment_id = new.segment_id
  ) then
    raise exception 'Add this vehicle to the Segment in Catalog before adding it to Rankings.'
      using errcode = '23503';
  end if;
  return new;
end;
$$;

drop trigger if exists rankings_placements_validate_catalog_segment
  on public.rankings_placements;
create trigger rankings_placements_validate_catalog_segment
  before insert or update of model_year_vehicle_id, segment_id
  on public.rankings_placements
  for each row execute procedure public.validate_rankings_placement_catalog_segment();

create or replace function public.remove_rankings_placements_for_catalog_segment()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  delete from public.rankings_placements
   where model_year_vehicle_id = old.model_year_vehicle_id
     and segment_id = old.segment_id;
  return old;
end;
$$;

drop trigger if exists model_year_vehicle_segments_remove_rankings_placements
  on public.model_year_vehicle_segments;
create trigger model_year_vehicle_segments_remove_rankings_placements
  after delete on public.model_year_vehicle_segments
  for each row execute procedure public.remove_rankings_placements_for_catalog_segment();

notify pgrst, 'reload schema';
