# /// script
# requires-python = ">=3.13"
# dependencies = ["pyyaml"]
# ///
"""Shared utilities for agent expertise system hooks."""
from __future__ import annotations

import os
import sys
from pathlib import Path

import yaml


def get_project_dir() -> Path:
    return Path(os.environ.get("CLAUDE_PROJECT_DIR", os.getcwd()))


def get_expertise_dir() -> Path:
    return get_project_dir() / ".expertise"


def get_config(expertise_dir: Path) -> dict:
    """Read config.yaml, returning defaults if missing or unparseable."""
    config_file = expertise_dir / "config.yaml"
    defaults = {"max_lines": 5000, "agents": []}

    if not config_file.exists():
        return defaults

    with open(config_file) as f:
        data = yaml.safe_load(f) or {}
    return {**defaults, **data}


def list_models(expertise_dir: Path) -> list[dict]:
    """List model files with metadata."""
    models_dir = expertise_dir / "models"
    if not models_dir.is_dir():
        return []

    models = []
    for f in sorted(models_dir.glob("*.yaml")):
        lines = len(f.read_text().splitlines())
        models.append({
            "filename": f.name,
            "path": str(f),
            "lines": lines,
            "empty": lines <= 1,
        })
    return models


def models_summary(models: list[dict]) -> str:
    """Format model list as text."""
    if not models:
        return "  (no models found)"
    parts = []
    for m in models:
        if m["empty"]:
            parts.append(f"  - {m['filename']} (empty)")
        else:
            parts.append(f"  - {m['filename']} ({m['lines']} lines)")
    return "\n".join(parts)


def count_solutions(project_dir: Path) -> int | None:
    """Count docs/solutions/*.md files. Returns None if dir doesn't exist."""
    solutions_dir = project_dir / "docs" / "solutions"
    if not solutions_dir.is_dir():
        return None
    return sum(1 for _ in solutions_dir.rglob("*.md"))


EXPERTISE_INSTRUCTIONS = """\
## Persistent Expertise Instructions

You maintain a personal mental model file at .expertise/models/<your-agent-name>.yaml \
in the project directory. This file persists across sessions and contains patterns, \
observations, and learnings accumulated about this specific codebase.

**At task start:** Read your mental model file for context before doing any work.
**After completing work:** Update your mental model file with any new patterns discovered, \
architectural observations, or open questions. Update stale entries rather than just appending.

If the file doesn't exist, create it. If it's empty, that's fine — build it up over time. \
Only update YOUR model file, never another agent's."""
