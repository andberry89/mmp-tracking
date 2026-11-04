-- Return only one filtered Published & Updated page plus exact totals.
create index if not exists mmp_tasks_publication_page_idx
  on public.mmp_tasks (status, published_at desc, created_at desc, id desc)
  where status in ('published', 'updated');

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
    select
      task.id,
      task.model_year_vehicle_id,
      task.author_id,
      task.status,
      task.task_kind,
      task.high_priority,
      task.deadline,
      task.notes,
      task.embargo_at,
      task.embargo_notes,
      task.published_at,
      task.created_at,
      task.updated_at,
      vehicle.model_year,
      vehicle.public_url,
      make.name as make_name,
      model.name as model_name,
      segment.name as segment_name
    from public.mmp_tasks as task
    join public.model_year_vehicles as vehicle on vehicle.id = task.model_year_vehicle_id
    join public.models as model on model.id = vehicle.model_id
    join public.makes as make on make.id = model.make_id
    left join public.segments as segment on segment.id = vehicle.segment_id
    where task.status in ('published', 'updated')
      and (p_start_at is null or task.published_at >= p_start_at)
      and (p_end_at is null or task.published_at <= p_end_at)
      and (p_author_id is null or task.author_id = p_author_id)
      and (
        nullif(btrim(p_query), '') is null
        or concat_ws(' ', make.name, model.name, vehicle.model_year::text, segment.name)
          ilike '%' || btrim(p_query) || '%'
      )
  ),
  page as (
    select *
      from filtered
     order by published_at desc nulls last, created_at desc, id desc
     limit least(greatest(coalesce(p_page_size, 25), 1), 100)
    offset (greatest(coalesce(p_page, 1), 1) - 1) * least(greatest(coalesce(p_page_size, 25), 1), 100)
  )
  select jsonb_build_object(
    'items', coalesce(
      jsonb_agg(
        jsonb_build_object(
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
            'segments', case when page.segment_name is null then null else jsonb_build_object('name', page.segment_name) end,
            'models', jsonb_build_object(
              'name', page.model_name,
              'makes', jsonb_build_object('name', page.make_name)
            )
          ),
          'task_resources', coalesce((
            select jsonb_agg(jsonb_build_object(
              'id', resource.id,
              'kind', resource.kind,
              'label', resource.label,
              'url', resource.url,
              'notes', resource.notes
            ) order by resource.created_at, resource.id)
            from public.task_resources as resource
            where resource.task_id = page.id
          ), '[]'::jsonb)
        ) order by page.published_at desc nulls last, page.created_at desc, page.id desc
      ),
      '[]'::jsonb
    ),
    'total_count', (select count(*) from filtered)
  )
  from page;
$$;

create or replace function public.get_published_task_stats(
  p_start_at timestamptz default null,
  p_end_at timestamptz default null
)
returns table (
  status public.task_status,
  model_year smallint,
  task_count bigint
)
language sql
stable
set search_path = public
as $$
  select task.status, vehicle.model_year, count(*)
    from public.mmp_tasks as task
    join public.model_year_vehicles as vehicle on vehicle.id = task.model_year_vehicle_id
   where task.status in ('published', 'updated')
     and (p_start_at is null or task.published_at >= p_start_at)
     and (p_end_at is null or task.published_at <= p_end_at)
   group by task.status, vehicle.model_year
   order by task.status, vehicle.model_year desc;
$$;

revoke all on function public.get_published_task_page(integer, integer, timestamptz, timestamptz, uuid, text)
  from public, anon;
revoke all on function public.get_published_task_stats(timestamptz, timestamptz)
  from public, anon;
grant execute on function public.get_published_task_page(integer, integer, timestamptz, timestamptz, uuid, text)
  to authenticated;
grant execute on function public.get_published_task_stats(timestamptz, timestamptz)
  to authenticated;
