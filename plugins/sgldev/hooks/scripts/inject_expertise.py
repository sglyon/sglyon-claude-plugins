#!/usr/bin/env python3
"""SubagentStart hook: inject expertise instructions into subagent via additionalContext."""

import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from expertise import (
    get_expertise_dir, list_models, models_summary, EXPERTISE_INSTRUCTIONS,
)


def main():
    expertise_dir = get_expertise_dir()
    if not expertise_dir.is_dir():
        return

    models = list_models(expertise_dir)

    lines = [
        "Agent expertise system is active for this project.",
        "",
        "Mental models available:",
        models_summary(models),
        "",
        EXPERTISE_INSTRUCTIONS,
    ]
    context = "\n".join(lines)

    print(json.dumps({
        "hookSpecificOutput": {
            "hookEventName": "SubagentStart",
            "additionalContext": context,
        }
    }))


if __name__ == "__main__":
    main()
