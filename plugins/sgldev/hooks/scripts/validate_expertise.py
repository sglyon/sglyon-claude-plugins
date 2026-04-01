#!/usr/bin/env python3
"""PostToolUse hook: validate YAML syntax and line limit for .expertise/models/ writes."""

import json
import sys
from pathlib import Path

import yaml

sys.path.insert(0, str(Path(__file__).parent))
from expertise import get_expertise_dir, get_config


def main():
    # Read hook input from stdin
    try:
        hook_input = json.load(sys.stdin)
    except (json.JSONDecodeError, EOFError):
        return  # Can't parse input, allow the action

    file_path = hook_input.get("tool_input", {}).get("file_path", "")
    if ".expertise/models/" not in file_path:
        return  # Not an expertise file, nothing to do

    path = Path(file_path)
    if not path.exists():
        return

    expertise_dir = get_expertise_dir()
    config = get_config(expertise_dir)
    max_lines = config["max_lines"]

    # Validate YAML syntax
    try:
        with open(path) as f:
            yaml.safe_load(f)
    except yaml.YAMLError as e:
        print(f"YAML validation failed for {path.name}: {e}", file=sys.stderr)
        print(f"\nFix the YAML syntax in {path} before continuing.", file=sys.stderr)
        sys.exit(2)

    # Check line count
    line_count = len(path.read_text().splitlines())
    if line_count > max_lines:
        print(f"Mental model file {path.name} has {line_count} lines (limit: {max_lines}).",
              file=sys.stderr)
        print(f"\nTrim low-value or outdated entries to stay under the limit.", file=sys.stderr)
        sys.exit(2)


if __name__ == "__main__":
    main()
