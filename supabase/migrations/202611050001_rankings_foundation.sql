-- Shared catalog support for Rankings, multi-segment vehicles, ratings, and award history.

create type public.body_style as enum ('cars', 'suvs', 'vans', 'pickup_trucks');
create type public.ranking_entry_state as enum ('ranked', 'unranked', 'future');
create type public.vehicle_award_type as enum ('ten_best', 'editors_choice');

alter table public.segments add column body_style public.body_style;

-- The 2027 Rank-in-segment worksheet is the source for these existing segment categories.
update public.segments set body_style = 'cars'
 where lower(name) in (
  'subcompact luxury cars', 'compact cars', 'sport compact cars', 'electric sedans and hatchbacks',
  'luxury sport compact cars', 'compact luxury cars', 'sports sedans', 'mid-size family sedans',
  'luxury mid-size cars', 'luxury electric cars', 'premium sports sedans', 'station wagons',
  'full-size luxury cars', 'ultimate luxury sedans', 'affordable sports cars', 'muscle cars',
  'performance sports cars', 'luxury sports cars', 'exotic sports cars',
  'ultimate luxury sports cars', 'hydrogen vehicles'
 );
update public.segments set body_style = 'suvs'
 where lower(name) in (
  'subcompact suvs', 'hybrid subcompact suvs', 'subcompact luxury suvs',
  'hybrid subcompact luxury suvs', 'electric subcompact suvs', 'compact suvs',
  'hybrid compact suvs', 'electric compact suvs', 'compact luxury suvs',
  'compact performance suvs', 'hybrid compact luxury suvs', 'electric compact luxury suvs',
  'mid-size two-row suvs', 'mid-size three-row suvs', 'hybrid mid-size suvs',
  'hybrid mid-size suvs', 'electric mid-size suvs', 'mid-size two-row luxury suvs',
  'mid-size three-row luxury suvs', 'hybrid mid-size luxury suvs',
  'electric mid-size luxury suvs', 'mid-size performance suvs', 'full-size suvs',
  'full-size luxury suvs', 'ultimate luxury suvs'
 );
update public.segments set body_style = 'vans'
 where lower(name) in ('minivans', 'full-size vans', 'electric vans');
update public.segments set body_style = 'pickup_trucks'
 where lower(name) in (
  'compact pickup trucks', 'mid-size pickup trucks', 'full-size pickup trucks',
  'electric pickup trucks', 'heavy duty pickup trucks'
 );

-- Give older catalog-only segment labels one of the four supported body styles.
update public.segments
   set body_style = case
     when lower(name) like '%pickup%' then 'pickup_trucks'::public.body_style
     when lower(name) like '%van%' then 'vans'::public.body_style
     when lower(name) like '%suv%' or lower(name) like '%crossover%' then 'suvs'::public.body_style
     else 'cars'::public.body_style
   end
 where body_style is null;
alter table public.segments alter column body_style set default 'cars';
alter table public.segments alter column body_style set not null;

alter table public.model_year_vehicles
  add column rating numeric(3, 1),
  add constraint model_year_vehicles_rating_range_check
    check (rating is null or (rating between 1 and 10 and rating * 2 = trunc(rating * 2))),
  add constraint model_year_vehicles_id_year_unique unique (id, model_year);

create table public.model_year_vehicle_segments (
  model_year_vehicle_id uuid not null,
  model_year smallint not null,
  segment_id uuid not null references public.segments (id) on delete restrict,
  rank_position integer,
  entry_state public.ranking_entry_state not null default 'unranked',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (model_year_vehicle_id, segment_id),
  foreign key (model_year_vehicle_id, model_year)
    references public.model_year_vehicles (id, model_year) on delete cascade,
  constraint model_year_vehicle_segments_rank_check
    check ((entry_state = 'ranked' and rank_position > 0)
      or (entry_state <> 'ranked' and rank_position is null)),
  constraint model_year_vehicle_segments_state_ranked_check
    check (entry_state <> 'ranked' or rank_position is not null)
);
create unique index model_year_vehicle_segments_rank_idx
  on public.model_year_vehicle_segments (model_year, segment_id, rank_position)
  where rank_position is not null;
create index model_year_vehicle_segments_vehicle_idx
  on public.model_year_vehicle_segments (model_year_vehicle_id);
create index model_year_vehicle_segments_segment_idx
  on public.model_year_vehicle_segments (segment_id, model_year);

insert into public.model_year_vehicle_segments
  (model_year_vehicle_id, model_year, segment_id, entry_state)
select vehicle.id, vehicle.model_year, vehicle.segment_id, 'unranked'
  from public.model_year_vehicles as vehicle
 where vehicle.segment_id is not null
on conflict (model_year_vehicle_id, segment_id) do nothing;

create table public.model_year_vehicle_awards (
  model_year_vehicle_id uuid not null references public.model_year_vehicles (id) on delete cascade,
  award_year smallint not null check (award_year between 1900 and 2200),
  award_type public.vehicle_award_type not null,
  created_at timestamptz not null default now(),
  primary key (model_year_vehicle_id, award_year, award_type)
);
create index model_year_vehicle_awards_year_idx
  on public.model_year_vehicle_awards (award_year desc, award_type);

-- Preserve existing Page Audit awards as awards for the audited model year.
insert into public.model_year_vehicle_awards (model_year_vehicle_id, award_year, award_type)
select audit.model_year_vehicle_id, vehicle.model_year, award.award_type
  from public.page_audit_entries as audit
  join public.model_year_vehicles as vehicle on vehicle.id = audit.model_year_vehicle_id
 cross join lateral (
   values
     ('ten_best'::public.vehicle_award_type, audit.awards ->> 'tenBest'),
     ('editors_choice'::public.vehicle_award_type, audit.awards ->> 'editorsChoice')
 ) as award(award_type, is_awarded)
 where award.is_awarded = 'true'
on conflict do nothing;

create or replace function public.sync_page_audit_awards_to_shared()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  v_model_year smallint;
begin
  select model_year into v_model_year
    from public.model_year_vehicles
   where id = new.model_year_vehicle_id;

  if coalesce(new.awards ->> 'tenBest', 'false') = 'true' then
    insert into public.model_year_vehicle_awards (model_year_vehicle_id, award_year, award_type)
    values (new.model_year_vehicle_id, v_model_year, 'ten_best')
    on conflict do nothing;
  else
    delete from public.model_year_vehicle_awards
     where model_year_vehicle_id = new.model_year_vehicle_id
       and award_year = v_model_year and award_type = 'ten_best';
  end if;

  if coalesce(new.awards ->> 'editorsChoice', 'false') = 'true' then
    insert into public.model_year_vehicle_awards (model_year_vehicle_id, award_year, award_type)
    values (new.model_year_vehicle_id, v_model_year, 'editors_choice')
    on conflict do nothing;
  else
    delete from public.model_year_vehicle_awards
     where model_year_vehicle_id = new.model_year_vehicle_id
       and award_year = v_model_year and award_type = 'editors_choice';
  end if;
  return new;
end;
$$;

create or replace function public.sync_shared_awards_to_page_audit()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  v_vehicle_id uuid := coalesce(new.model_year_vehicle_id, old.model_year_vehicle_id);
  v_model_year smallint;
  v_awards jsonb;
begin
  select model_year into v_model_year from public.model_year_vehicles where id = v_vehicle_id;
  select jsonb_build_object(
    'tenBest', exists (
      select 1 from public.model_year_vehicle_awards
       where model_year_vehicle_id = v_vehicle_id and award_year = v_model_year and award_type = 'ten_best'
    ),
    'editorsChoice', exists (
      select 1 from public.model_year_vehicle_awards
       where model_year_vehicle_id = v_vehicle_id and award_year = v_model_year and award_type = 'editors_choice'
    )
  ) into v_awards;

  update public.page_audit_entries
     set awards = v_awards
   where model_year_vehicle_id = v_vehicle_id
     and awards is distinct from v_awards;
  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

create trigger page_audit_awards_sync_shared
  after insert or update of awards on public.page_audit_entries
  for each row execute procedure public.sync_page_audit_awards_to_shared();
create trigger shared_awards_sync_page_audit
  after insert or update or delete on public.model_year_vehicle_awards
  for each row execute procedure public.sync_shared_awards_to_page_audit();

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
        )
     ) then
    raise exception 'The ranked vehicle list changed. Refresh the Rankings view and try again.' using errcode = '40001';
  end if;

  update public.model_year_vehicle_segments
     set rank_position = null,
         entry_state = case when entry_state = 'future' then 'future'::public.ranking_entry_state else 'unranked'::public.ranking_entry_state end
   where model_year = p_model_year and segment_id = p_segment_id and rank_position is not null;

  update public.model_year_vehicle_segments as entry
     set rank_position = ordered.position,
         entry_state = 'ranked',
         updated_at = now()
    from unnest(p_vehicle_ids) with ordinality as ordered(vehicle_id, position)
   where entry.model_year = p_model_year
     and entry.segment_id = p_segment_id
     and entry.model_year_vehicle_id = ordered.vehicle_id;
end;
$$;

alter table public.model_year_vehicle_segments enable row level security;
grant select, insert, update, delete on public.model_year_vehicle_segments to authenticated;
create policy "Authenticated users can read model-year segment entries"
  on public.model_year_vehicle_segments for select to authenticated using ((select public.is_authorized_user()));
create policy "Editors can manage model-year segment entries"
  on public.model_year_vehicle_segments for all to authenticated
  using ((select public.is_editor())) with check ((select public.is_editor()));
create trigger model_year_vehicle_segments_set_updated_at
  before update on public.model_year_vehicle_segments
  for each row execute procedure public.set_updated_at();

alter table public.model_year_vehicle_awards enable row level security;
grant select, insert, update, delete on public.model_year_vehicle_awards to authenticated;
create policy "Authenticated users can read model-year vehicle awards"
  on public.model_year_vehicle_awards for select to authenticated using ((select public.is_authorized_user()));
create policy "Editors can manage model-year vehicle awards"
  on public.model_year_vehicle_awards for all to authenticated
  using ((select public.is_editor())) with check ((select public.is_editor()));

-- Published & Updated history must display all shared segment assignments too.
create or replace function public.get_published_task_page(
  p_page integer default 1,
  p_page_size integer default 25,
  p_start_at timestamptz default null,
  p_end_at timestamptz default null,
  p_author_id uuid default null,
  p_query text default null
)
returns jsonb
language sql
stable
set search_path = public
as $$
  with filtered as (
    select task.id, task.model_year_vehicle_id, task.author_id, task.status,
           task.task_kind, task.high_priority, task.deadline, task.notes,
           task.embargo_at, task.embargo_notes, task.published_at,
           task.created_at, task.updated_at, vehicle.model_year,
           vehicle.public_url, make.name as make_name, model.name as model_name,
           segment_list.segment_names,
           segment_list.segment_json
      from public.mmp_tasks as task
      join public.model_year_vehicles as vehicle on vehicle.id = task.model_year_vehicle_id
      join public.models as model on model.id = vehicle.model_id
      join public.makes as make on make.id = model.make_id
      left join lateral (
        select string_agg(segment.name, ', ' order by segment.name) as segment_names,
               jsonb_agg(jsonb_build_object('segments', jsonb_build_object('name', segment.name)) order by segment.name) as segment_json
          from public.model_year_vehicle_segments as assignment
          join public.segments as segment on segment.id = assignment.segment_id
         where assignment.model_year_vehicle_id = vehicle.id
      ) as segment_list on true
     where task.status in ('published', 'updated')
       and (p_start_at is null or task.published_at >= p_start_at)
       and (p_end_at is null or task.published_at <= p_end_at)
       and (p_author_id is null or task.author_id = p_author_id)
       and (nullif(btrim(p_query), '') is null or concat_ws(' ', make.name, model.name, vehicle.model_year::text, segment_list.segment_names) ilike '%' || btrim(p_query) || '%')
  ), page as (
    select * from filtered
     order by published_at desc nulls last, created_at desc, id desc
     limit least(greatest(coalesce(p_page_size, 25), 1), 100)
    offset (greatest(coalesce(p_page, 1), 1) - 1) * least(greatest(coalesce(p_page_size, 25), 1), 100)
  )
  select jsonb_build_object(
    'items', coalesce(jsonb_agg(jsonb_build_object(
      'id', page.id,
      'model_year_vehicle_id', page.model_year_vehicle_id,
      'author_id', page.author_id,
      'status', page.status,
      'task_kind', page.task_kind,
      'high_priority', page.high_priority,
      'deadline', page.deadline,
      'notes', page.notes,
      'embargo_at', page.embargo_at,
      'embargo_notes', page.embargo_notes,
      'published_at', page.published_at,
      'created_at', page.created_at,
      'updated_at', page.updated_at,
      'model_year_vehicles', jsonb_build_object(
        'id', page.model_year_vehicle_id,
        'model_year', page.model_year,
        'model_year_vehicle_segments', coalesce(page.segment_json, '[]'::jsonb),
        'public_url', page.public_url,
        'models', jsonb_build_object('name', page.model_name, 'makes', jsonb_build_object('name', page.make_name))
      ),
      'task_resources', coalesce((
        select jsonb_agg(jsonb_build_object('id', resource.id, 'kind', resource.kind, 'label', resource.label, 'url', resource.url, 'notes', resource.notes) order by resource.created_at, resource.id)
          from public.task_resources as resource where resource.task_id = page.id
      ), '[]'::jsonb)
    ) order by page.published_at desc nulls last, page.created_at desc, page.id desc), '[]'::jsonb),
    'total_count', (select count(*) from filtered)
  ) from page;
$$;

revoke all on function public.get_published_task_page(integer, integer, timestamptz, timestamptz, uuid, text) from public, anon;
grant execute on function public.get_published_task_page(integer, integer, timestamptz, timestamptz, uuid, text) to authenticated;

-- Keep trigger entry points private; triggers execute them without client grants.
revoke all on function public.sync_page_audit_awards_to_shared() from public, anon, authenticated;
revoke all on function public.sync_shared_awards_to_page_audit() from public, anon, authenticated;

-- Extend annual Changeover preparation so every prior-year segment carries forward.
alter function public.prepare_next_changeover_year(smallint) rename to prepare_next_changeover_year_single_segment;
revoke all on function public.prepare_next_changeover_year_single_segment(smallint) from public, anon, authenticated;

create or replace function public.prepare_next_changeover_year(p_current_year smallint)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_next_year smallint := p_current_year + 1;
  v_result jsonb;
begin
  if not public.is_editor() then
    raise exception 'Only Editors can prepare a Changeover year.' using errcode = '42501';
  end if;

  v_result := public.prepare_next_changeover_year_single_segment(p_current_year);

  with source_segments as (
    select vehicle.model_id, assignment.segment_id
      from public.changeover_entries as changeover
      join public.model_year_vehicles as vehicle on vehicle.id = changeover.model_year_vehicle_id
      join public.model_year_vehicle_segments as assignment on assignment.model_year_vehicle_id = vehicle.id
     where vehicle.model_year = p_current_year and changeover.status <> 'dead'
    union
    select vehicle.model_id, assignment.segment_id
      from public.page_audit_entries as audit
      join public.model_year_vehicles as vehicle on vehicle.id = audit.model_year_vehicle_id
      join public.model_year_vehicle_segments as assignment on assignment.model_year_vehicle_id = vehicle.id
     where vehicle.model_year = p_current_year
       and not exists (
         select 1 from public.changeover_entries as dead_entry
         join public.model_year_vehicles as dead_vehicle on dead_vehicle.id = dead_entry.model_year_vehicle_id
          where dead_vehicle.model_year = p_current_year
            and dead_vehicle.model_id = vehicle.model_id
            and dead_entry.status = 'dead'
       )
  )
  insert into public.model_year_vehicle_segments
    (model_year_vehicle_id, model_year, segment_id, entry_state)
  select target.id, v_next_year, source.segment_id, 'unranked'
    from source_segments as source
    join public.model_year_vehicles as target
      on target.model_id = source.model_id and target.model_year = v_next_year
  on conflict (model_year_vehicle_id, segment_id) do nothing;

  return v_result;
end;
$$;
revoke all on function public.prepare_next_changeover_year(smallint) from public, anon;
grant execute on function public.prepare_next_changeover_year(smallint) to authenticated;

revoke all on function public.save_model_year_segment_order(smallint, uuid, uuid[])
  from public, anon;
grant execute on function public.save_model_year_segment_order(smallint, uuid, uuid[])
  to authenticated;

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    if not exists (
      select 1 from pg_publication_tables
       where pubname = 'supabase_realtime' and schemaname = 'public'
         and tablename = 'model_year_vehicle_segments'
    ) then
      alter publication supabase_realtime add table public.model_year_vehicle_segments;
    end if;
    if not exists (
      select 1 from pg_publication_tables
       where pubname = 'supabase_realtime' and schemaname = 'public'
         and tablename = 'model_year_vehicle_awards'
    ) then
      alter publication supabase_realtime add table public.model_year_vehicle_awards;
    end if;
  end if;
end;
$$;
