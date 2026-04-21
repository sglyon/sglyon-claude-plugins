#!/usr/bin/env python3
# /// script
# requires-python = ">=3.13"
# dependencies = ["pyyaml"]
# ///
"""PostToolUse hook: enforce line limit and discourage stale .yaml writes under .expertise/models/."""

import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from expertise import get_expertise_dir, get_config


def main():
    try:
        hook_input = json.load(sys.stdin)
    except (json.JSONDecodeError, EOFError):
        return

    file_path = hook_input.get("tool_input", {}).get("file_path", "")
    if ".expertise/models/" not in file_path:
        return

    path = Path(file_path)
    if not path.exists():
        return

    if path.suffix == ".yaml":
        print(
            f"Mental model files are now markdown. Rename {path.name} to "
            f"{path.stem}.md and use markdown structure (headings, lists). "
            "See the expertise instructions for what to write.",
            file=sys.stderr,
        )
        sys.exit(2)

    if path.suffix != ".md":
        return

    expertise_dir = get_expertise_dir()
    config = get_config(expertise_dir)
    max_lines = config["max_lines"]

    line_count = len(path.read_text().splitlines())
    if line_count > max_lines:
        print(
            f"Mental model file {path.name} has {line_count} lines (limit: {max_lines}). "
            "Trim low-value or outdated entries to stay under the limit.",
            file=sys.stderr,
        )
        sys.exit(2)


if __name__ == "__main__":
    main()
