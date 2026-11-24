#!/bin/bash
set -euo pipefail
umask 077

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
BACKUP_DIR="${MMP_BACKUP_DIR:-$HOME/Library/CloudStorage/OneDrive-Hearst/MMP Tracking Backups}"
CRYPTO_HELPER="$SCRIPT_DIR/backup_crypto.swift"

log() {
  printf '[%s] %s\n' "$(date -u '+%Y-%m-%dT%H:%M:%SZ')" "$*"
}

fail() {
  log "ERROR: $*"
  exit 1
}

for command_name in supabase docker swift tar shasum; do
  command -v "$command_name" >/dev/null 2>&1 || fail "Required program not found: $command_name"
done

[[ -f "$PROJECT_DIR/supabase/config.toml" ]] || fail "Run this from the MMP Tracking project checkout."
[[ -f "$PROJECT_DIR/supabase/.temp/project-ref" ]] || fail "This checkout is not linked to a Supabase project. Run supabase link --project-ref <project-ref> first."
[[ -f "$PROJECT_DIR/supabase/.temp/pooler-url" ]] || fail "The Supabase IPv4 pooler setting is missing. Run supabase link --project-ref <project-ref> again."
[[ -f "$CRYPTO_HELPER" ]] || fail "Encryption helper not found: $CRYPTO_HELPER"
[[ -d "$BACKUP_DIR" ]] || fail "OneDrive backup folder is missing: $BACKUP_DIR"

if ! docker info >/dev/null 2>&1; then
  log "Starting Docker Desktop for the database export."
  open -g -a Docker || fail "Could not start Docker Desktop."
  for _ in $(seq 1 120); do
    if docker info >/dev/null 2>&1; then
      break
    fi
    sleep 2
  done
  docker info >/dev/null 2>&1 || fail "Docker did not become ready within four minutes."
fi

cd "$PROJECT_DIR"

WORK_DIR="$(mktemp -d "${TMPDIR:-/tmp}/mmp-tracking-backup.XXXXXX")"
trap 'rm -rf "$WORK_DIR"' EXIT
chmod 700 "$WORK_DIR"

STAMP="$(date -u '+%Y%m%dT%H%M%SZ')"
ARCHIVE_NAME="mmp-tracking-backup-${STAMP}.tar.gz.enc"
ARCHIVE_PATH="$BACKUP_DIR/$ARCHIVE_NAME"
TEMP_ARCHIVE="$WORK_DIR/backup.tar.gz"
TEMP_ENCRYPTED="$WORK_DIR/backup.tar.gz.enc"
VERIFY_ARCHIVE="$WORK_DIR/verify.tar.gz"

swift "$PROJECT_DIR/scripts/backup_crypto.swift" init-key

log "Exporting the linked Supabase database schema."
supabase db dump --linked --yes --file "$WORK_DIR/schema.sql"
log "Exporting application data."
supabase db dump --linked --yes --data-only --file "$WORK_DIR/data.sql"
log "Exporting custom database roles."
supabase db dump --linked --yes --role-only --file "$WORK_DIR/roles.sql"

cat > "$WORK_DIR/manifest.txt" <<EOF
MMP Tracking database backup
Created (UTC): $STAMP
Supabase CLI: $(supabase --version 2>/dev/null | tail -n 1)
Contents: schema.sql, data.sql, roles.sql
Encryption: Apple CryptoKit AES-256-GCM; key stored in the macOS login Keychain
Scope note: Supabase CLI excludes managed auth, storage, and extension schemas.
EOF

(cd "$WORK_DIR" && shasum -a 256 schema.sql data.sql roles.sql manifest.txt > SHA256SUMS)
(
  cd "$WORK_DIR"
  shasum -a 256 -c SHA256SUMS >/dev/null
)
tar -czf "$TEMP_ARCHIVE" -C "$WORK_DIR" schema.sql data.sql roles.sql manifest.txt SHA256SUMS
swift "$PROJECT_DIR/scripts/backup_crypto.swift" encrypt "$TEMP_ARCHIVE" "$TEMP_ENCRYPTED"

# Decrypt and inspect the archive before placing it in the OneDrive-synced folder.
swift "$PROJECT_DIR/scripts/backup_crypto.swift" decrypt "$TEMP_ENCRYPTED" "$VERIFY_ARCHIVE"
tar -tzf "$VERIFY_ARCHIVE" >/dev/null || fail "Encrypted backup verification failed."

# Copy as a hidden temporary file, then rename to the final name so OneDrive only
# sees a completed backup under the retention pattern.
cp "$TEMP_ENCRYPTED" "$BACKUP_DIR/.${ARCHIVE_NAME}.uploading"
mv "$BACKUP_DIR/.${ARCHIVE_NAME}.uploading" "$ARCHIVE_PATH"
log "Verified encrypted backup saved: $ARCHIVE_PATH"

if find "$BACKUP_DIR" -maxdepth 1 -type f -name 'mmp-tracking-backup-*.tar.gz.enc' -mtime +30 -print -delete; then
  log "Completed the 30-day backup retention cleanup."
else
  # OneDrive may allow writing files while denying directory enumeration to a
  # background LaunchAgent. Keep the verified backup and report cleanup as a
  # separate limitation instead of marking the backup itself as failed.
  log "WARNING: OneDrive blocked retention cleanup. The verified backup is saved; remove archives older than 30 days manually."
fi
