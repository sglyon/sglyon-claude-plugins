#!/usr/bin/env bash
set -euo pipefail

# SessionStart hook: check for .expertise/ and output a summary.
# Silent exit if no expertise system found for this project.

PROJECT_DIR="${CLAUDE_PROJECT_DIR:-$(pwd)}"
EXPERTISE_DIR="$PROJECT_DIR/.expertise"

# Silent exit if no expertise directory
if [ ! -d "$EXPERTISE_DIR" ]; then
  exit 0
fi

# Platform-aware file date
file_date() {
  if stat -f '%Sm' "$1" 2>/dev/null; then
    return
  fi
  # Linux fallback
  stat -c '%y' "$1" 2>/dev/null | cut -d' ' -f1 || echo "unknown"
}

echo "Agent expertise system is active for this project."
echo ""
echo "Mental models available:"

models_dir="$EXPERTISE_DIR/models"
if [ -d "$models_dir" ]; then
  for model_file in "$models_dir"/*.yaml; do
    [ -f "$model_file" ] || continue
    filename=$(basename "$model_file")
    lines=$(wc -l < "$model_file" | tr -d ' ')
    modified=$(file_date "$model_file")

    if [ "$lines" -le 1 ]; then
      echo "  - $filename (empty)"
    else
      echo "  - $filename (last updated: $modified, $lines lines)"
    fi
  done
else
  echo "  (no models directory found)"
fi

# Check for docs/solutions/ (managed by compound-engineering plugin)
solutions_dir="$PROJECT_DIR/docs/solutions"
if [ -d "$solutions_dir" ]; then
  solution_count=$(find "$solutions_dir" -name '*.md' -type f 2>/dev/null | wc -l | tr -d ' ')
  echo ""
  echo "Institutional knowledge: docs/solutions/ contains $solution_count documented solutions."
fi

echo ""
echo "Agents should read their mental model file at the start of tasks and update it with learnings."
