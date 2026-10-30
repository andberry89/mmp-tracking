# Publication Tracking test import

The full import is split into smaller SQL queries because Supabase SQL Editor rejects the original query when it is too large.

## Run in Supabase

1. In the non-production Supabase project, open SQL Editor.
2. Open and run `01_tasks.sql`.
3. Continue with `02_tasks.sql` through `12_tasks.sql`, one file at a time and in order. Each one reports how many Catalog records matched and how many tasks it inserted.
4. After all 12 task batches succeed, run `13_resources_and_date_cleanup.sql` once. This adds the active-work links and preserves blank publication dates.

If a batch reports an SQL error, stop and share the error. Each batch commits independently, and stable IDs make it safe to rerun a batch after correcting the problem.

This is test data from the current workbook. It adds records without deleting or refreshing existing rows. Do not run it against a production database.
