#!/usr/bin/env bash
set -euo pipefail

# SubagentStart hook: inject expertise instructions into subagent context.
# Uses hookSpecificOutput.additionalContext so the subagent actually receives it.
# Silent exit if no expertise system found for this project.

PROJECT_DIR="${CLAUDE_PROJECT_DIR:-$(pwd)}"
EXPERTISE_DIR="$PROJECT_DIR/.expertise"

# Silent exit if no expertise directory
if [ ! -d "$EXPERTISE_DIR" ]; then
  exit 0
fi

# Build the context string
context="Agent expertise system is active for this project."
context+="\n\n"

# List available models
models_dir="$EXPERTISE_DIR/models"
if [ -d "$models_dir" ]; then
  context+="Mental models available:\n"
  for model_file in "$models_dir"/*.yaml; do
    [ -f "$model_file" ] || continue
    filename=$(basename "$model_file")
    lines=$(wc -l < "$model_file" | tr -d ' ')
    if [ "$lines" -le 1 ]; then
      context+="  - $filename (empty)\n"
    else
      context+="  - $filename ($lines lines)\n"
    fi
  done
fi

context+="\n"
context+="## Persistent Expertise Instructions\n\n"
context+="You maintain a personal mental model file at .expertise/models/<your-agent-name>.yaml "
context+="in the project directory. This file persists across sessions and contains patterns, "
context+="observations, and learnings accumulated about this specific codebase.\n\n"
context+="**At task start:** Read your mental model file for context before doing any work.\n"
context+="**After completing work:** Update your mental model file with any new patterns discovered, "
context+="architectural observations, or open questions. Update stale entries rather than just appending.\n\n"
context+="If the file doesn't exist, create it. If it's empty, that's fine — build it up over time. "
context+="Only update YOUR model file, never another agent's."

# Output structured JSON so SubagentStart injects into subagent context
python3 -c "
import json, sys
context = sys.argv[1]
print(json.dumps({
    'hookSpecificOutput': {
        'hookEventName': 'SubagentStart',
        'additionalContext': context
    }
}))
" "$context"
