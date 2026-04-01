#!/usr/bin/env python3
"""PreCompact hook: preserve expertise awareness across context compaction."""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from expertise import get_expertise_dir, list_models


def main():
    expertise_dir = get_expertise_dir()
    if not expertise_dir.is_dir():
        return

    models = list_models(expertise_dir)
    active = [m for m in models if not m["empty"]]

    parts = [
        "IMPORTANT CONTEXT TO PRESERVE: This project uses the agent expertise system (.expertise/).",
        "Agents maintain mental model files at .expertise/models/<agent>.yaml that persist across sessions.",
        "Read your model at task start, update it after work.",
    ]

    if active:
        model_list = ", ".join(f"{m['filename']} ({m['lines']} lines)" for m in active)
        parts.append(f"Active models: {model_list}.")

    print(" ".join(parts))


if __name__ == "__main__":
    main()
