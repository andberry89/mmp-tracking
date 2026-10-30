-- Resource links on unpublished Changeover rows must not populate the shared
-- published-page URL used by Page Audit and Publication Tracking.
alter table public.changeover_entries
  add column if not exists resource_url text;

-- Move existing non-published links onto their Changeover row.
update public.changeover_entries c
   set resource_url = v.public_url
  from public.model_year_vehicles v
 where c.model_year_vehicle_id = v.id
   and c.status <> 'published'
   and c.resource_url is null
   and nullif(btrim(v.public_url), '') is not null;

-- The shared URL is reserved for published pages.
update public.model_year_vehicles v
   set public_url = null
  from public.changeover_entries c
 where c.model_year_vehicle_id = v.id
   and c.status <> 'published'
   and v.public_url is not null;
