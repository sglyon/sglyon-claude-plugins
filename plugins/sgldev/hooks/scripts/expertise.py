# /// script
# requires-python = ">=3.13"
# dependencies = ["pyyaml"]
# ///
"""Shared utilities for agent expertise system hooks."""
from __future__ import annotations

import os
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
    """List model files with metadata. Models are markdown files."""
    models_dir = expertise_dir / "models"
    if not models_dir.is_dir():
        return []

    models = []
    for f in sorted(models_dir.glob("*.md")):
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
## Persistent Expertise — Mental Model File

You maintain a personal mental model file at `.expertise/models/<your-agent-name>.md` \
in the project directory. This file persists across sessions and accumulates \
**repo-specific facts you could not have known without working in this codebase**.

### Lifecycle

1. **At task start:** Read your mental model file for context.
2. **Before drafting your final reply:** Update your mental model file with new \
findings from this session. Do this *before* composing your reply, not after.
3. **Then deliver your full reply.** The expertise file is a side effect; your reply \
to the lead is the primary output. Never truncate your reply to make room for the \
update — the lead agent depends on what you return.

If the file doesn't exist, create it. If it's empty, that's fine — it grows over time.
Only update YOUR file, never another agent's.

### What to write (DO)

- Concrete file paths (`lib/arilearn/payments/charge.ex`)
- Enum values, schema constants, magic strings used by this codebase
- Non-obvious architectural facts (e.g., "this app uses Ash 3.x but resource X still \
uses 2.x DSL")
- Bugs you hit and how the codebase actually behaves vs. how you expected it to behave
- Conventions specific to this repo that contradict generic best practice
- Open questions you couldn't resolve and where to look next time

### What NOT to write (DON'T)

- Your role, purpose, heuristics, or analysis protocol — those live in your agent \
definition and are loaded fresh every session. Repeating them here wastes lines.
- Generic best-practice prose ("always validate inputs", "prefer composition") — \
this is true everywhere and adds no project-specific value.
- The findings of the current task — those go in your reply to the lead. The mental \
model captures *durable* facts about the repo, not transient analysis.
- Build output, test logs, transcripts, or copy-pasted file contents.

### Format

Use markdown. Free-form structure. Suggested headings: `## Repo Facts`, \
`## Gotchas`, `## Open Questions`, `## Recent Sessions` (one-line entries). \
Update existing entries when your understanding changes — don't accumulate \
contradictions by appending.
"""
