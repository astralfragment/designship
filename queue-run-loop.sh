#!/usr/bin/env bash

set -euo pipefail

QUEUE_GRACE_SECONDS="${QUEUE_GRACE_SECONDS:-180}"
QUEUE_LIMIT_PATTERNS=(
  "You're out of extra usage"
  "You've hit your limit"
  "detected limit pattern"
  "Usage limit reached"
)
LAST_LIMIT_LINE=""
SELF_PATH="${BASH_SOURCE[0]}"

if command -v python3 >/dev/null 2>&1; then
  PYTHON_BIN="python3"
elif command -v python >/dev/null 2>&1; then
  PYTHON_BIN="python"
else
  echo "queue-run-loop.sh requires python3 or python in PATH" >&2
  exit 1
fi

log() {
  printf '[queue-run-loop] %s\n' "$*"
}

trace_supervisor_start() {
  if [[ -n "${QUEUE_TRACE_FILE:-}" ]]; then
    printf '%s %s\n' "$BASHPID" "${SHLVL:-1}" >> "$QUEUE_TRACE_FILE"
  fi
}

usage() {
  cat <<'EOF'
Usage:
  ./queue-run-loop.sh
  ./queue-run-loop.sh <command> [args...]
  ./queue-run-loop.sh --parse-reset-iso "<limit line>"

Defaults to running:
  ./run-loop.sh start

Environment:
  QUEUE_GRACE_SECONDS  Extra seconds to wait after reset (default: 180)
  QUEUE_NO_SLEEP       If set to 1, skip the actual sleep (useful for tests)
  QUEUE_TZ_OFFSETS     Optional timezone overrides like Africa/Johannesburg=+02:00
  QUEUE_EXTRA_PATTERNS Optional extra limit patterns (comma-separated)
EOF
}

# Merge any user-supplied extra patterns from env
_merge_extra_patterns() {
  local raw="${QUEUE_EXTRA_PATTERNS:-}"
  if [[ -z "$raw" ]]; then
    return
  fi
  IFS=',' read -ra extras <<< "$raw"
  for p in "${extras[@]}"; do
    p="$(echo "$p" | xargs)" # trim whitespace
    if [[ -n "$p" ]]; then
      QUEUE_LIMIT_PATTERNS+=("$p")
    fi
  done
}
_merge_extra_patterns

parse_reset_iso() {
  local line="$1"

  QUEUE_GRACE_SECONDS="$QUEUE_GRACE_SECONDS" "$PYTHON_BIN" - "$line" <<'PY'
import os
import re
import sys
from datetime import datetime, timedelta, timezone

line = sys.argv[1]
grace_seconds = int(os.environ.get("QUEUE_GRACE_SECONDS", "180"))
lines = [segment.strip() for segment in line.splitlines() if segment.strip()]

# --- locate the fragment that contains "resets <time>" ---
reset_line = None
for segment in lines:
    if "resets " in segment:
        reset_line = segment
        break

# fallback: look for "resets" followed by a time anywhere across all lines
if reset_line is None:
    combined = " ".join(lines)
    if "resets " in combined:
        reset_line = combined

if reset_line is None:
    raise SystemExit("Could not find reset time in line")

reset_match = re.search(r"resets\s+(.+?)(?:\s*·|\s*$)", reset_line)
if not reset_match:
    reset_match = re.search(r"resets\s+(.+)$", reset_line)
if not reset_match:
    raise SystemExit("Could not parse reset time in line")

time_text = reset_match.group(1).strip()
timezone_name = None

def parse_offset(offset_text):
    match = re.fullmatch(r"([+-])(\d{1,2})(?::?(\d{2}))?", offset_text.strip())
    if not match:
        raise SystemExit(f"Unsupported UTC offset: {offset_text}")

    sign = -1 if match.group(1) == "-" else 1
    hours = int(match.group(2))
    minutes = int(match.group(3) or "0")
    delta = timedelta(hours=hours, minutes=minutes) * sign
    return timezone(delta)

def load_timezone_overrides():
    overrides = {}
    raw_value = os.environ.get("QUEUE_TZ_OFFSETS", "")
    if not raw_value.strip():
        return overrides

    for item in re.split(r"[;,]", raw_value):
        if not item.strip():
            continue
        if "=" not in item:
            raise SystemExit(f"Invalid QUEUE_TZ_OFFSETS entry: {item}")
        name, offset = item.split("=", 1)
        overrides[name.strip()] = offset.strip()
    return overrides

def resolve_timezone(name):
    direct_offset = re.fullmatch(r"[+-]\d{1,2}(?::?\d{2})?", name)
    if direct_offset:
        return parse_offset(name)

    utc_offset = re.fullmatch(
        r"(?:UTC|GMT)([+-]\d{1,2}(?::?\d{2})?)", name, re.IGNORECASE
    )
    if utc_offset:
        return parse_offset(utc_offset.group(1))

    overrides = load_timezone_overrides()
    fallback_offsets = {
        "Africa/Johannesburg": "+02:00",
        "Africa/Cairo": "+02:00",
        "Africa/Lagos": "+01:00",
        "Africa/Nairobi": "+03:00",
        "America/New_York": "-05:00",
        "America/Chicago": "-06:00",
        "America/Denver": "-07:00",
        "America/Los_Angeles": "-08:00",
        "America/Sao_Paulo": "-03:00",
        "Asia/Kolkata": "+05:30",
        "Asia/Shanghai": "+08:00",
        "Asia/Tokyo": "+09:00",
        "Asia/Dubai": "+04:00",
        "Asia/Singapore": "+08:00",
        "Australia/Sydney": "+11:00",
        "Europe/London": "+00:00",
        "Europe/Berlin": "+01:00",
        "Europe/Paris": "+01:00",
        "Europe/Moscow": "+03:00",
        "Pacific/Auckland": "+13:00",
        "UTC": "+00:00",
        "Etc/UTC": "+00:00",
        "GMT": "+00:00",
        "SAST": "+02:00",
        "EST": "-05:00",
        "CST": "-06:00",
        "MST": "-07:00",
        "PST": "-08:00",
        "IST": "+05:30",
        "JST": "+09:00",
        "CET": "+01:00",
        "EET": "+02:00",
        "AEST": "+10:00",
        "NZST": "+12:00",
    }
    offset_text = overrides.get(name) or fallback_offsets.get(name)
    if offset_text is None:
        raise SystemExit(
            f"No fixed UTC offset available for timezone: {name}. "
            "Set QUEUE_TZ_OFFSETS to add one."
        )
    return parse_offset(offset_text)

# --- extract timezone name ---
# 1. inline parenthesized timezone on the time_text itself
inline_timezone = re.search(r"\(([^)]+)\)", time_text)
if inline_timezone:
    timezone_name = inline_timezone.group(1).strip()
    time_text = re.sub(r"\s*\([^)]+\)\s*$", "", time_text).strip()

# 2. parenthesized timezone anywhere on the reset_line
if timezone_name is None:
    tz_match = re.search(r"\(([^)]+)\)", reset_line)
    if tz_match:
        timezone_name = tz_match.group(1).strip()

# 3. parenthesized timezone on any collected line
if timezone_name is None:
    for segment in lines:
        tz_match = re.search(r"(?:\[[^\]]+\]\s*)?\(([^)]+)\)", segment)
        if tz_match:
            timezone_name = tz_match.group(1).strip()
            break

# 4. last resort – default to UTC
if timezone_name is None:
    timezone_name = "UTC"

time_text = time_text.lower().replace(" ", "")
# strip any trailing parenthesized text that leaked through
time_text = re.sub(r"\([^)]*\)", "", time_text).strip()
zone = resolve_timezone(timezone_name)

# --- determine base_time from a bracketed timestamp or now ---
timestamp_match = None
for segment in lines:
    timestamp_match = re.search(
        r"\[(\d{2})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})\]",
        segment,
    )
    if timestamp_match:
        break

if timestamp_match is not None:
    year = 2000 + int(timestamp_match.group(1))
    month = int(timestamp_match.group(2))
    day = int(timestamp_match.group(3))
    hour = int(timestamp_match.group(4))
    minute = int(timestamp_match.group(5))
    second = int(timestamp_match.group(6))
    base_time = datetime(year, month, day, hour, minute, second, tzinfo=zone)
else:
    base_time = datetime.now(zone)

# --- parse the reset time ---
parsed_time = None
for pattern in ("%I%p", "%I:%M%p", "%I:%M:%S%p", "%H:%M", "%H:%M:%S", "%H"):
    try:
        parsed_time = datetime.strptime(time_text, pattern).time()
        break
    except ValueError:
        continue

# handle bare "5pm" style – manual fallback
if parsed_time is None:
    bare_match = re.fullmatch(r"(\d{1,2})(am|pm)", time_text, re.IGNORECASE)
    if bare_match:
        h = int(bare_match.group(1))
        suffix = bare_match.group(2).lower()
        if suffix == "pm" and h != 12:
            h += 12
        elif suffix == "am" and h == 12:
            h = 0
        from datetime import time as _time
        parsed_time = _time(h, 0, 0)

if parsed_time is None:
    raise SystemExit(f"Unsupported reset time format: {time_text}")

target_time = base_time.replace(
    hour=parsed_time.hour,
    minute=parsed_time.minute,
    second=0,
    microsecond=0,
)

if target_time <= base_time:
    target_time += timedelta(days=1)

target_time += timedelta(seconds=grace_seconds)
print(target_time.isoformat())
PY
}

extract_limit_message() {
  local output_file="$1"

  local joined_patterns
  joined_patterns="$(printf '%s\n' "${QUEUE_LIMIT_PATTERNS[@]}")"

  QUEUE_LIMIT_PATTERNS_JOINED="$joined_patterns" \
    "$PYTHON_BIN" - "$output_file" <<'PY'
import os
import sys

path = sys.argv[1]
needles = [
    n
    for n in os.environ["QUEUE_LIMIT_PATTERNS_JOINED"].split("\n")
    if n.strip()
]

with open(path, encoding="utf-8") as handle:
    lines = [line.rstrip("\n") for line in handle]

# ── Phase 1: collect every block that touches a limit pattern ──
blocks = []
index = 0
while index < len(lines):
    line = lines[index]
    if any(needle in line for needle in needles):
        collected = [line]
        look_ahead = index + 1
        while look_ahead < len(lines):
            candidate = lines[look_ahead]
            stripped = candidate.strip()
            # grab bracketed timestamp lines with parenthesized timezone
            if (
                stripped.startswith("[")
                and stripped.endswith(")")
                and "(" in stripped
            ):
                collected.append(candidate)
                look_ahead += 1
                continue
            # grab any line that carries a reset time
            if "resets " in candidate:
                collected.append(candidate)
                look_ahead += 1
                continue
            # grab secondary limit/error lines that reference the same event
            if any(needle in candidate for needle in needles):
                collected.append(candidate)
                look_ahead += 1
                continue
            break

        # also look backwards from the trigger line for reset info
        look_behind = index - 1
        while look_behind >= 0:
            candidate = lines[look_behind]
            if "resets " in candidate:
                collected.insert(0, candidate)
                look_behind -= 1
                continue
            # grab the line with the original limit message + reset info
            if any(needle in candidate for needle in needles):
                collected.insert(0, candidate)
                look_behind -= 1
                continue
            break

        blocks.append("\n".join(collected))
        index = look_ahead
        continue
    index += 1

if not blocks:
    sys.exit(0)

# ── Phase 2: prefer a block that contains "resets " ──
best = None
for block in reversed(blocks):
    if "resets " in block:
        best = block
        break

# fall back to the last block if none have "resets "
if best is None:
    best = blocks[-1]

print(best)
PY
}

iso_to_epoch() {
  local iso_timestamp="$1"

  "$PYTHON_BIN" - "$iso_timestamp" <<'PY'
import sys
from datetime import datetime

print(int(datetime.fromisoformat(sys.argv[1]).timestamp()))
PY
}

wait_until_iso() {
  local iso_timestamp="$1"
  local target_epoch
  local now_epoch
  local sleep_seconds

  target_epoch="$(iso_to_epoch "$iso_timestamp")"
  now_epoch="$("$PYTHON_BIN" - <<'PY'
import time
print(int(time.time()))
PY
)"

  sleep_seconds="$((target_epoch - now_epoch))"
  if (( sleep_seconds < 0 )); then
    sleep_seconds=0
  fi

  log "Usage limit reached. Waiting until $iso_timestamp (${sleep_seconds}s)."

  if [[ "${QUEUE_NO_SLEEP:-0}" == "1" ]]; then
    return 0
  fi

  sleep "$sleep_seconds"
}

run_once() {
  local -a command=("$@")
  local output_file
  local exit_code

  output_file="$(mktemp)"

  set +e
  "${command[@]}" 2>&1 | tee "$output_file"
  exit_code="${PIPESTATUS[0]}"
  set -e

  LAST_LIMIT_LINE="$(extract_limit_message "$output_file")"
  rm -f "$output_file"

  return "$exit_code"
}

main() {
  local -a command
  local -a original_args=("$@")
  local exit_code
  local reset_iso

  trace_supervisor_start

  case "${1:-}" in
    --help|-h)
      usage
      exit 0
      ;;
    --parse-reset-iso)
      shift
      parse_reset_iso "$*"
      exit 0
      ;;
    "")
      command=(./run-loop.sh start)
      ;;
    *)
      command=("$@")
      ;;
  esac

  while true; do
    if run_once "${command[@]}"; then
      exit 0
    fi
    exit_code=$?

    if [[ -z "$LAST_LIMIT_LINE" ]]; then
      log "Command failed (exit $exit_code) but no usage-limit message detected. Exiting."
      exit "$exit_code"
    fi

    log "Detected usage limit message:"
    while IFS= read -r _log_line; do
      log "  $_log_line"
    done <<< "$LAST_LIMIT_LINE"

    if ! reset_iso="$(parse_reset_iso "$LAST_LIMIT_LINE" 2>&1)"; then
      log "Could not parse reset time from limit message: $reset_iso"
      log "Falling back to a ${QUEUE_GRACE_SECONDS}s cooldown."
      if [[ "${QUEUE_NO_SLEEP:-0}" != "1" ]]; then
        sleep "$QUEUE_GRACE_SECONDS"
      fi
      log "Restarting watcher and command after fallback cooldown."
      exec env SHLVL=1 bash "$SELF_PATH" "${original_args[@]}"
    fi

    wait_until_iso "$reset_iso"
    log "Restarting watcher and command after reset window."
    exec env SHLVL=1 bash "$SELF_PATH" "${original_args[@]}"
  done
}

main "$@"
