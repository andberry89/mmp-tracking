-- Keep the current Changeover assignment in sync when an MMP task author changes.
-- Page Audit links to the same Author record as Publication Tracking and Changeover.

alter table public.page_audit_entries
  add column if not exists author_id uuid references public.authors (id) on delete set null;

-- Keep the first listed historical author and link it when the roster contains that Author.
with normalized as (
  select audit.id,
         nullif(btrim(case
           when exists (
             select 1 from public.authors as exact_author
              where lower(btrim(exact_author.label)) = lower(btrim(audit.author_names))
           ) then audit.author_names
           else regexp_replace(
             btrim(audit.author_names),
             '[[:space:]]*(;|,|/|&|[[:space:]]+and[[:space:]]+).*$','', 'i'
           )
         end), '') as first_author_name
    from public.page_audit_entries as audit
), mapped as (
  select normalized.id,
         normalized.first_author_name,
         author.id as author_id
    from normalized
    left join public.authors as author
      on lower(btrim(author.label)) = lower(btrim(normalized.first_author_name))
)
update public.page_audit_entries as audit
   set author_id = mapped.author_id,
       author_names = coalesce(mapped.first_author_name, '')
  from mapped
 where audit.id = mapped.id;

create index if not exists page_audit_entries_author_id_idx
  on public.page_audit_entries (author_id);

create or replace function public.sync_task_author_to_changeover()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  v_author_label text;
begin
  -- Creating an unassigned task should not erase an existing manual Changeover assignment.
  if tg_op = 'INSERT' and new.author_id is null then
    return new;
  end if;

  select label into v_author_label
    from public.authors
   where id = new.author_id;

  update public.changeover_entries
     set assigned_author_id = new.author_id
   where model_year_vehicle_id = new.model_year_vehicle_id
     and assigned_author_id is distinct from new.author_id;

  update public.page_audit_entries
     set author_id = new.author_id,
         author_names = coalesce(v_author_label, '')
   where model_year_vehicle_id = new.model_year_vehicle_id
     and (author_id is distinct from new.author_id
       or author_names is distinct from coalesce(v_author_label, ''));

  return new;
end;
$$;

drop trigger if exists mmp_tasks_sync_changeover_author_insert on public.mmp_tasks;
create trigger mmp_tasks_sync_changeover_author_insert
  after insert on public.mmp_tasks
  for each row execute function public.sync_task_author_to_changeover();

drop trigger if exists mmp_tasks_sync_changeover_author_update on public.mmp_tasks;
create trigger mmp_tasks_sync_changeover_author_update
  after update of author_id on public.mmp_tasks
  for each row
  when (old.author_id is distinct from new.author_id)
  execute function public.sync_task_author_to_changeover();

revoke all on function public.sync_task_author_to_changeover() from public, anon, authenticated;
