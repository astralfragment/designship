#!/bin/bash
# DesignShip — Ralphex Runner
# Usage: ./run-loop.sh [start|status|dashboard]

set -e

case "${1:-}" in

start)
  echo ""
  echo "  DesignShip — MVP Build"
  echo "  ======================="
  echo "  Plan: docs/plans/designship-mvp.md"
  echo "  Dashboard: http://localhost:8080"
  echo ""
  echo "  Ctrl+\\ to pause and steer"
  echo "  Ctrl+C to abort"
  echo ""
  ralphex --serve --port 8080 --session-timeout 45m --idle-timeout 15m \
    docs/plans/designship-mvp.md
  ;;

status)
  echo ""
  echo "  Plan Status"
  echo "  ==========="
  echo ""
  for plan in docs/plans/*.md; do
    name=$(head -1 "$plan" | sed 's/# Plan: //')
    done=$(grep -c "\- \[x\]" "$plan" 2>/dev/null || echo 0)
    todo=$(grep -c "\- \[ \]" "$plan" 2>/dev/null || echo 0)
    total=$((done + todo))
    if [ "$total" -gt 0 ]; then
      pct=$((done * 100 / total))
    else
      pct=0
    fi
    echo "  $(basename "$plan" .md):"
    echo "    $name"
    echo "    $done/$total tasks ($pct%)"
    echo ""
  done
  ;;

dashboard)
  echo "Starting dashboard only..."
  ralphex --serve --port 8080 --watch "C:\Users\char\Desktop\designship"
  ;;

*)
  echo ""
  echo "  DesignShip — Ralphex Runner"
  echo "  ==========================="
  echo ""
  echo "  ./run-loop.sh start      — Run MVP build plan"
  echo "  ./run-loop.sh status     — Show completion for all plans"
  echo "  ./run-loop.sh dashboard  — Dashboard monitoring only"
  echo ""
  echo "  With auto-retry on usage limits:"
  echo "  ./queue-run-loop.sh ./run-loop.sh start"
  echo ""
  ;;

esac
