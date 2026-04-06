#!/usr/bin/env bash
# DesignShip — OpenCode/Claude Queue Runner (with auto-retry on limits)
# Usage: ./queue-opencode.sh [start|ship|mvp|status|dashboard]
# Environment: DESIGNSHIP_AI=opencode|claude (default: opencode)
#
# This script wraps queue-run-loop.sh and passes through the DESIGNSHIP_AI
# environment variable for consistent provider selection.

set -euo pipefail

DESIGNSHIP_AI="${DESIGNSHIP_AI:-opencode}"
SELF_PATH="${BASH_SOURCE[0]}"
REPO_ROOT="$(cd "$(dirname "$SELF_PATH")" && pwd)"

# Export so child processes inherit
export DESIGNSHIP_AI

log() {
    printf '[queue-opencode] %s\n' "$*"
}

usage() {
    cat <<'EOF'
Usage:
  ./queue-opencode.sh [command]

Environment:
  DESIGNSHIP_AI=opencode|claude  (default: opencode)

Commands:
  start, ship  — Run the ship plan (default if no command given)
  mvp          — Run MVP build plan
  status       — Show plan completion status
  dashboard    — Start dashboard only

Examples:
  ./queue-opencode.sh                    (defaults to: ./run-opencode.sh start)
  ./queue-opencode.sh start
  ./queue-opencode.sh mvp
  DESIGNSHIP_AI=claude ./queue-opencode.sh ship

This script delegates to queue-run-loop.sh with DESIGNSHIP_AI preset.
It provides auto-retry functionality when API rate limits are hit.
EOF
}

# Check if queue-run-loop.sh exists
if [ ! -f "$REPO_ROOT/queue-run-loop.sh" ]; then
    log "ERROR: queue-run-loop.sh not found in $REPO_ROOT"
    log "Make sure queue-run-loop.sh exists alongside queue-opencode.sh"
    exit 1
fi

case "${1:-}" in
    --help|-h)
        usage
        exit 0
        ;;
    "")
        log "Starting with DESIGNSHIP_AI=$DESIGNSHIP_AI"
        log "Command: ./run-opencode.sh start"
        log "Delegating to queue-run-loop.sh..."
        echo ""
        exec bash "$REPO_ROOT/queue-run-loop.sh" ./run-opencode.sh start
        ;;
    start|ship|mvp|status|dashboard)
        log "Starting with DESIGNSHIP_AI=$DESIGNSHIP_AI"
        log "Command: ./run-opencode.sh $1"
        log "Delegating to queue-run-loop.sh..."
        echo ""
        exec bash "$REPO_ROOT/queue-run-loop.sh" ./run-opencode.sh "$1"
        ;;
    *)
        log "ERROR: Unknown command: $1"
        usage
        exit 1
        ;;
esac
