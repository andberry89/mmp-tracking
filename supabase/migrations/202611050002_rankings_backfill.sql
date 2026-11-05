-- Fill older Segment categories and carry valid C/D ratings into the shared field.
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

with parsed_ratings as (
  select audit.model_year_vehicle_id,
         (audit.checklist ->> 'cd_rating')::numeric as rating,
         row_number() over (
           partition by audit.model_year_vehicle_id
           order by audit.audited_at desc nulls last, audit.updated_at desc, audit.id desc
         ) as recency
    from public.page_audit_entries as audit
   where coalesce(audit.checklist ->> 'cd_rating', '') ~ '^[0-9]+(\.[0-9]+)?$'
), valid_ratings as (
  select model_year_vehicle_id, rating
    from parsed_ratings
   where recency = 1
     and rating between 1 and 10
     and rating * 2 = trunc(rating * 2)
)
update public.model_year_vehicles as vehicle
   set rating = valid.rating
  from valid_ratings as valid
 where vehicle.id = valid.model_year_vehicle_id
   and vehicle.rating is null;
