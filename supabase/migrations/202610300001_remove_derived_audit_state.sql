-- The in-progress audit state was an app assumption, not a workbook field.
-- The two award-badge columns are intentionally not part of the app checklist.
update public.page_audit_entries
   set checklist = checklist - 'ten_best' - 'editors_choice'
 where checklist ? 'ten_best' or checklist ? 'editors_choice';

-- A non-public editor URL from the workbook is not an audit note or live URL.
update public.page_audit_entries
   set audit_notes = ''
 where audit_notes like 'Workbook Live Link points to a non-public destination; retained here for review:%';

-- Remove only the derived state and the excluded award-badge answers.
drop index if exists public.page_audit_entries_state_idx;
alter table public.page_audit_entries drop column if exists audit_state;
drop type if exists public.page_audit_state;
