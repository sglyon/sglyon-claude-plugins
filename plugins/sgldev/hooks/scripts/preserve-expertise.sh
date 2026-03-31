#!/usr/bin/env bash
set -euo pipefail

# PreCompact hook: inject expertise awareness so compacted context preserves it.
# Without this, a long session that compacts loses the SessionStart context.

PROJECT_DIR="${CLAUDE_PROJECT_DIR:-$(pwd)}"
EXPERTISE_DIR="$PROJECT_DIR/.expertise"

# Silent exit if no expertise directory
if [ ! -d "$EXPERTISE_DIR" ]; then
  exit 0
fi

# Build a compact summary for the compacted context to preserve
models_dir="$EXPERTISE_DIR/models"
summary="IMPORTANT CONTEXT TO PRESERVE: This project uses the agent expertise system (.expertise/). "
summary+="Agents maintain mental model files at .expertise/models/<agent>.yaml that persist across sessions. "
summary+="Read your model at task start, update it after work."

if [ -d "$models_dir" ]; then
  active_models=""
  for model_file in "$models_dir"/*.yaml; do
    [ -f "$model_file" ] || continue
    lines=$(wc -l < "$model_file" | tr -d ' ')
    if [ "$lines" -gt 1 ]; then
      filename=$(basename "$model_file")
      active_models+=" $filename ($lines lines),"
    fi
  done
  if [ -n "$active_models" ]; then
    summary+=" Active models:${active_models%,}."
  fi
fi

echo "$summary"
