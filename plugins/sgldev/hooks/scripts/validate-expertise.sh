#!/usr/bin/env bash
set -euo pipefail

# PostToolUse hook: validate YAML syntax and line limit for .expertise/models/ writes.
# Receives hook input JSON on stdin. Silent exit for non-expertise files.

PROJECT_DIR="${CLAUDE_PROJECT_DIR:-$(pwd)}"
EXPERTISE_DIR="$PROJECT_DIR/.expertise"
CONFIG_FILE="$EXPERTISE_DIR/config.yaml"

# Read hook input and extract file path
input=$(cat)
file_path=$(echo "$input" | python3 -c "
import json, sys
d = json.load(sys.stdin)
ti = d.get('tool_input', {})
print(ti.get('file_path', ''))
" 2>/dev/null || echo "")

# Silent exit if not an expertise model file
if [[ "$file_path" != *".expertise/models/"* ]]; then
  exit 0
fi

# Check file exists
if [ ! -f "$file_path" ]; then
  exit 0
fi

# Read max_lines from config (default 5000)
max_lines=5000
if [ -f "$CONFIG_FILE" ]; then
  configured=$(grep '^max_lines:' "$CONFIG_FILE" 2>/dev/null | awk '{print $2}' || echo "")
  if [ -n "$configured" ]; then
    max_lines="$configured"
  fi
fi

# Validate YAML syntax
yaml_valid=true
yaml_error=""

if python3 -c "import yaml" 2>/dev/null; then
  # PyYAML available — full validation
  yaml_error=$(python3 -c "
import yaml, sys
try:
    yaml.safe_load(open('$file_path'))
except yaml.YAMLError as e:
    print(str(e))
    sys.exit(1)
" 2>&1) || yaml_valid=false
else
  # Fallback: basic syntax checks
  if grep -P '^\t' "$file_path" >/dev/null 2>&1; then
    yaml_valid=false
    yaml_error="YAML files must use spaces, not tabs for indentation"
  fi
fi

if [ "$yaml_valid" = false ]; then
  echo "YAML validation failed for $(basename "$file_path"): $yaml_error" >&2
  echo "" >&2
  echo "Fix the YAML syntax in $file_path before continuing." >&2
  exit 2
fi

# Check line count
line_count=$(wc -l < "$file_path" | tr -d ' ')
if [ "$line_count" -gt "$max_lines" ]; then
  echo "Mental model file $(basename "$file_path") has $line_count lines (limit: $max_lines)." >&2
  echo "" >&2
  echo "Trim low-value or outdated entries to stay under the limit." >&2
  exit 2
fi

exit 0
