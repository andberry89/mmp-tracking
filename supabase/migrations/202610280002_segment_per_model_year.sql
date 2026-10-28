-- A model's market segment can change across model years. Store that mapping on
-- the shared Make/Model/Year vehicle record used by tasks, Changeover, and audit.
alter table public.model_year_vehicles
  add column if not exists segment_id uuid references public.segments (id) on delete set null;

-- Preserve any model-level assignments already made by copying them to existing
-- vehicle/year rows. The old models.segment_id column remains for compatibility.
update public.model_year_vehicles as vehicle
   set segment_id = model.segment_id
  from public.models as model
 where vehicle.model_id = model.id
   and vehicle.segment_id is null
   and model.segment_id is not null;

create index if not exists model_year_vehicles_segment_idx
  on public.model_year_vehicles (segment_id);
