#!/usr/bin/env bash
set -euo pipefail

# Initialize the .expertise/ directory structure in a target project.
# Usage: bash init-expertise.sh [project_dir]
# Idempotent — safe to re-run.

PROJECT_DIR="${1:-${CLAUDE_PROJECT_DIR:-$(pwd)}}"
EXPERTISE_DIR="$PROJECT_DIR/.expertise"
MODELS_DIR="$EXPERTISE_DIR/models"
CONFIG_FILE="$EXPERTISE_DIR/config.yaml"

# Default agents
DEFAULT_AGENTS=(
  ash-reviewer
  elixir-reviewer
  liveview-reviewer
  python-reviewer
  typescript-reviewer
  team-lead
)

echo "Initializing agent expertise system in: $PROJECT_DIR"
echo ""

# Create directory structure
created=0
existed=0

if [ ! -d "$MODELS_DIR" ]; then
  mkdir -p "$MODELS_DIR"
  echo "  Created: .expertise/models/"
  created=$((created + 1))
else
  echo "  Exists:  .expertise/models/"
  existed=$((existed + 1))
fi

# Create config.yaml with defaults if it doesn't exist
if [ ! -f "$CONFIG_FILE" ]; then
  cat > "$CONFIG_FILE" << 'YAML'
max_lines: 5000
agents:
  - ash-reviewer
  - elixir-reviewer
  - liveview-reviewer
  - python-reviewer
  - typescript-reviewer
  - team-lead
YAML
  echo "  Created: .expertise/config.yaml"
  created=$((created + 1))
else
  echo "  Exists:  .expertise/config.yaml"
  existed=$((existed + 1))
fi

# Read agents from config if it exists, otherwise use defaults
if [ -f "$CONFIG_FILE" ]; then
  # Parse agent list from YAML (simple grep approach, no PyYAML dependency)
  mapfile -t AGENTS < <(grep -A 100 '^agents:' "$CONFIG_FILE" | tail -n +2 | grep '^ *- ' | sed 's/^ *- //')
  if [ ${#AGENTS[@]} -eq 0 ]; then
    AGENTS=("${DEFAULT_AGENTS[@]}")
  fi
else
  AGENTS=("${DEFAULT_AGENTS[@]}")
fi

# Create empty model files for each agent
for agent in "${AGENTS[@]}"; do
  model_file="$MODELS_DIR/$agent.yaml"
  if [ ! -f "$model_file" ]; then
    echo "# Mental model for $agent — this file grows across sessions" > "$model_file"
    echo "  Created: .expertise/models/$agent.yaml"
    created=$((created + 1))
  else
    echo "  Exists:  .expertise/models/$agent.yaml"
    existed=$((existed + 1))
  fi
done

echo ""

# Check for .gitignore issues
if [ -f "$PROJECT_DIR/.gitignore" ]; then
  if grep -q '\.expertise' "$PROJECT_DIR/.gitignore" 2>/dev/null; then
    echo "WARNING: .gitignore contains .expertise — mental models should be git-tracked."
    echo "  Remove the .expertise entry from .gitignore if you want models committed."
    echo ""
  fi
fi

# Check for CLAUDE.md mention
if [ -f "$PROJECT_DIR/CLAUDE.md" ]; then
  if ! grep -q '\.expertise' "$PROJECT_DIR/CLAUDE.md" 2>/dev/null; then
    echo "SUGGESTION: Add a note about .expertise/ to your CLAUDE.md, e.g.:"
    echo '  "This project uses .expertise/ for per-agent mental models (sgldev plugin)."'
    echo ""
  fi
fi

echo "Done. Created $created items, $existed already existed."
