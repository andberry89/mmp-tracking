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

  if coalesce(new.awards ->> 'evOfTheYear', 'false') = 'true' then
    insert into public.model_year_vehicle_awards (model_year_vehicle_id, award_year, award_type)
    values (new.model_year_vehicle_id, v_model_year, 'ev_of_the_year')
    on conflict do nothing;
  else
    delete from public.model_year_vehicle_awards
     where model_year_vehicle_id = new.model_year_vehicle_id
       and award_year = v_model_year and award_type = 'ev_of_the_year';
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
    ),
    'evOfTheYear', exists (
      select 1 from public.model_year_vehicle_awards
       where model_year_vehicle_id = v_vehicle_id and award_year = v_model_year and award_type = 'ev_of_the_year'
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
