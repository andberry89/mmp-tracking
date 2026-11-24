# Database backups

The Free Supabase project does not provide downloadable automatic backups. This
Mac backup routine exports the linked database and stores encrypted archives in
the synced OneDrive folder `MMP Tracking Backups`.

## What it backs up

The Supabase CLI creates three files:

- `schema.sql` — database schema and functions.
- `data.sql` — application records, including tasks, Changeover, Page Audit,
  Rankings, Catalog, user-access metadata, resources, and resource passwords.
- `roles.sql` — custom database role definitions.

The CLI excludes Supabase-managed `auth`, `storage`, and extension schemas.
Auth accounts and passwords must be recreated/reset if a project is rebuilt.
Storage files are not included. The app currently keeps resource links and
passwords in the database and does not use Supabase Storage for those resources.
The first export reported a circular foreign-key relationship in `model_years`.
The schema identifies it as `prepared_from_year`, which points back to another
model-year row. A restore drill confirmed the data loads with normal foreign-key
checks enabled.

## Security and retention

The SQL files are created in a private temporary folder, packaged, encrypted
with authenticated AES-256-GCM, and verified before the encrypted archive is
copied into OneDrive. The encryption key is generated once and stored in the
current Mac user's login Keychain; it is never written to the repository or
OneDrive. The setup command prints a recovery copy; save it in a
company-approved password manager before closing Terminal. Anyone with that
key can read the backups. Keep the Keychain item and recovery copy; without
either one, encrypted archives cannot be restored. The scheduled job never
prints the key into its log.

The LaunchAgent runs daily at 2:15 AM local time while this Mac user account is
logged in. It starts Docker Desktop if needed and attempts to keep the most
recent 30 days of encrypted backup files. macOS currently blocks the LaunchAgent
from enumerating the OneDrive folder, so cleanup is manual; this does not prevent
the verified backup from being saved. It uses the Supabase CLI's existing login
and linked project. The installer stages the backup scripts and Supabase link settings,
including the IPv4 pooler address, in `~/Library/Application Support/MMP Tracking
Backup` so the scheduled job does not need to run from the macOS-protected
Desktop folder. Do not put database passwords or service-role keys in this
repository.

## Setup and manual run

From the repository folder in Terminal, run:

```sh
./scripts/install_mmp_backup_agent.sh
```

This initializes the Keychain key, prints a recovery copy to save in a
company-approved password manager, installs the daily LaunchAgent, and starts a
first backup. Do not paste the recovery key into chat, a source file, or OneDrive.
To run a backup manually later:

```sh
./scripts/backup_supabase_to_onedrive.sh
```

The backup goes to:

```text
~/Library/CloudStorage/OneDrive-Hearst/MMP Tracking Backups
```

Override the destination for a run with `MMP_BACKUP_DIR=/path/to/folder`.
Execution output is written to `~/Library/Logs/MMPTrackingBackup.log` and errors
to the adjacent `.error` file.
If you need to display the recovery key again while signed in to this Mac, run
`swift scripts/backup_crypto.swift print-recovery-key` locally and store it
securely.

## Restore verification

An archive is checked for successful decryption and valid gzip/tar structure
before it is saved. A restore drill on November 24, 2026, also succeeded in a
disposable local Supabase stack: the roles, schema, and data files loaded, all
16 public application tables were present, all 29 public RLS policies were
restored, and the `prepared_from_year` foreign keys passed with normal
constraint checks enabled.

`pg_dump` still reports a generic circular-foreign-key warning because
`model_years.prepared_from_year` points back to `model_years.year`. In this
backup, the data restored successfully without disabling triggers or changing
constraints. The CLI excludes managed Auth and Storage schemas, so Auth users
must be recreated/reset during a disaster recovery and Storage objects are not
part of this backup. Never restore over production as a test.

The backup files are reaching OneDrive, but the scheduled LaunchAgent cannot
enumerate the synced folder for automatic 30-day cleanup. Older files currently
need manual retention management.
