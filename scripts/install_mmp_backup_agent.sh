#!/bin/bash
set -euo pipefail
umask 077

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
BACKUP_DIR="${MMP_BACKUP_DIR:-$HOME/Library/CloudStorage/OneDrive-Hearst/MMP Tracking Backups}"
SUPPORT_DIR="$HOME/Library/Application Support/MMP Tracking Backup"
LABEL="com.hearst.mmp-tracking-backup"
PLIST_PATH="$HOME/Library/LaunchAgents/$LABEL.plist"
LOG_DIR="$HOME/Library/Logs"
UID_VALUE="$(id -u)"

[[ -d "$BACKUP_DIR" ]] || { printf 'OneDrive backup folder not found: %s\n' "$BACKUP_DIR" >&2; exit 1; }
command -v swift >/dev/null 2>&1 || { printf 'Swift is required to initialize the encryption key.\n' >&2; exit 1; }
command -v python3 >/dev/null 2>&1 || { printf 'Python 3 is required to install the scheduled job.\n' >&2; exit 1; }
[[ -f "$PROJECT_DIR/supabase/.temp/project-ref" ]] || { printf 'This checkout is not linked to a Supabase project. Run supabase link first.\n' >&2; exit 1; }
[[ -f "$PROJECT_DIR/supabase/.temp/pooler-url" ]] || { printf 'Supabase IPv4 connection settings are missing. Run supabase link again.\n' >&2; exit 1; }

mkdir -p "$SUPPORT_DIR/scripts" "$SUPPORT_DIR/supabase/.temp"
cp "$SCRIPT_DIR/backup_crypto.swift" "$SUPPORT_DIR/scripts/backup_crypto.swift"
cp "$SCRIPT_DIR/backup_supabase_to_onedrive.sh" "$SUPPORT_DIR/scripts/backup_supabase_to_onedrive.sh"
cp "$PROJECT_DIR/supabase/config.toml" "$SUPPORT_DIR/supabase/config.toml"
cp "$PROJECT_DIR/supabase/.temp/project-ref" "$SUPPORT_DIR/supabase/.temp/project-ref"
cp "$PROJECT_DIR/supabase/.temp/pooler-url" "$SUPPORT_DIR/supabase/.temp/pooler-url"
chmod 700 "$SUPPORT_DIR" "$SUPPORT_DIR/scripts" "$SUPPORT_DIR/supabase" "$SUPPORT_DIR/supabase/.temp"
chmod 600 "$SUPPORT_DIR/scripts/backup_crypto.swift" "$SUPPORT_DIR/supabase/config.toml" "$SUPPORT_DIR/supabase/.temp/project-ref" "$SUPPORT_DIR/supabase/.temp/pooler-url"
chmod 700 "$SUPPORT_DIR/scripts/backup_supabase_to_onedrive.sh"

swift "$SUPPORT_DIR/scripts/backup_crypto.swift" init-key
printf 'Save this recovery key in a company-approved password manager. Do not put it in OneDrive or share it in chat.\n'
swift "$SUPPORT_DIR/scripts/backup_crypto.swift" print-recovery-key

mkdir -p "$HOME/Library/LaunchAgents" "$LOG_DIR"
python3 - "$PLIST_PATH" "$SUPPORT_DIR/scripts/backup_supabase_to_onedrive.sh" "$LOG_DIR/MMPTrackingBackup.log" "$HOME" "$SUPPORT_DIR" <<'PY'
import plistlib
import sys

plist_path, script_path, log_path, home, support_dir = sys.argv[1:]
job = {
    "Label": "com.hearst.mmp-tracking-backup",
    "ProgramArguments": ["/bin/bash", script_path],
    "StartCalendarInterval": {"Hour": 2, "Minute": 15},
    "RunAtLoad": False,
    "StandardOutPath": log_path,
    "StandardErrorPath": log_path + ".error",
    "WorkingDirectory": support_dir,
    "EnvironmentVariables": {
        "HOME": home,
        "PATH": "/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin",
    },
}
with open(plist_path, "wb") as stream:
    plistlib.dump(job, stream)
PY

launchctl bootout "gui/$UID_VALUE/$LABEL" >/dev/null 2>&1 || true
launchctl bootstrap "gui/$UID_VALUE" "$PLIST_PATH"
launchctl enable "gui/$UID_VALUE/$LABEL"
printf 'Installed daily backup at 2:15 AM. Starting the first backup now...\n'
launchctl kickstart -k "gui/$UID_VALUE/$LABEL"
printf 'Setup complete. Check %s for the first run result.\n' "$LOG_DIR/MMPTrackingBackup.log"
