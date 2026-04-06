#!/bin/bash
# DesignShip — Ralphex Runner
# Usage: ./run-loop.sh [start|ship|mvp|status|dashboard]

set -e

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$REPO_ROOT"

PORT=8181
SESSION_TIMEOUT=45m
IDLE_TIMEOUT=15m

run_plan() {
  local label="$1"
  local plan="$2"

  if [ ! -f "$plan" ]; then
    echo ""
    echo "  ERROR: plan file not found: $plan"
    echo "  Available plans:"
    ls docs/plans/*.md 2>/dev/null | sed 's|^|    |'
    exit 1
  fi

  local branch
  branch="$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo unknown)"

  echo ""
  echo "  DesignShip — $label"
  echo "  $(printf '%.0s=' $(seq 1 $((${#label} + 14))))"
  echo "  Plan:      $plan"
  echo "  Branch:    $branch"
  echo "  Dashboard: http://localhost:$PORT"
  echo ""
  echo "  Ctrl+\\ to pause and steer"
  echo "  Ctrl+C to abort"
  echo ""

  exec ralphex --serve --port "$PORT" \
    --session-timeout "$SESSION_TIMEOUT" \
    --idle-timeout "$IDLE_TIMEOUT" \
    "$plan"
}

case "${1:-}" in

start|ship)
  # Default entry point. Runs the ship plan (README + GitHub + Vercel deploy).
  run_plan "Document, Push, Deploy" "docs/plans/designship-ship.md"
  ;;

mvp)
  run_plan "MVP Build" "docs/plans/designship-mvp.md"
  ;;

status)
  echo ""
  echo "  Plan Status"
  echo "  ==========="
  echo ""
  for plan in docs/plans/*.md docs/plans/completed/*.md; do
    [ -f "$plan" ] || continue
    name=$(head -1 "$plan" | sed 's/# Plan: //')
    set +e
    done=$(grep -c "^- \[x\]" "$plan" 2>/dev/null)
    todo=$(grep -c "^- \[ \]" "$plan" 2>/dev/null)
    set -e
    done=${done:-0}
    todo=${todo:-0}
    total=$((done + todo))
    if [ "$total" -gt 0 ]; then
      pct=$((done * 100 / total))
    else
      pct=0
    fi
    rel="${plan#docs/plans/}"
    printf "  %-32s %s\n" "$rel:" "$name"
    printf "  %-32s %d/%d tasks (%d%%)\n" "" "$done" "$total" "$pct"
    echo ""
  done
  ;;

dashboard)
  echo "Starting dashboard only on port $PORT..."
  exec ralphex --serve --port "$PORT" --watch "$REPO_ROOT"
  ;;

help|--help|-h|"")
  cat <<'HELP'

  DesignShip — Ralphex Runner
  ===========================

  ./run-loop.sh start       — Run the default plan (ship — README + GitHub + Vercel)
  ./run-loop.sh ship        — Document + push + deploy plan
  ./run-loop.sh mvp         — Original MVP build plan
  ./run-loop.sh status      — Show completion across all plans
  ./run-loop.sh dashboard   — Dashboard monitoring only (port 8181)

  With auto-retry on API usage limits:
    ./queue-run-loop.sh                    (defaults to: ./run-loop.sh start)
    ./queue-run-loop.sh ./run-loop.sh ship
    ./queue-run-loop.sh ./run-loop.sh mvp

  Every task in every plan must end with a commit.

HELP
  ;;

*)
  echo ""
  echo "  Unknown mode: $1"
  echo "  Run './run-loop.sh help' for usage."
  exit 1
  ;;

esac
