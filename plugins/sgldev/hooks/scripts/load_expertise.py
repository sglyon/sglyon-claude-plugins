#!/usr/bin/env python3
"""SessionStart hook: output expertise summary as context for the main session."""

import sys
from pathlib import Path

# Add this directory to path for shared module
sys.path.insert(0, str(Path(__file__).parent))
from expertise import (
    get_expertise_dir, get_project_dir, list_models,
    models_summary, count_solutions, EXPERTISE_INSTRUCTIONS,
)


def main():
    expertise_dir = get_expertise_dir()
    if not expertise_dir.is_dir():
        return

    models = list_models(expertise_dir)

    print("Agent expertise system is active for this project.")
    print()
    print("Mental models available:")
    print(models_summary(models))

    solution_count = count_solutions(get_project_dir())
    if solution_count is not None:
        print()
        print(f"Institutional knowledge: docs/solutions/ contains {solution_count} documented solutions.")

    print()
    print(EXPERTISE_INSTRUCTIONS)


if __name__ == "__main__":
    main()
