---
name: expertise
description: "Shows the status of the agent expertise system for the current project. Displays mental model file sizes, last-modified dates, and top-level keys. Use when asking about expertise status, agent knowledge state, or mental model overview."
---

# Expertise Dashboard

Display the current state of the agent expertise system for this project.

## Steps

1. **Check for `.expertise/` directory** in the project root. If it doesn't exist, tell the user:
   - The expertise system isn't initialized for this project
   - They can initialize it by running: `bash $CLAUDE_PLUGIN_ROOT/scripts/init-expertise.sh`
   - Stop here.

2. **Read `.expertise/config.yaml`** and display:
   - Configured max_lines limit
   - List of configured agents

3. **For each model file** in `.expertise/models/`, display:
   - Filename
   - Line count
   - Whether it's empty (only has the initial comment) or has content
   - Top-level YAML keys (first level only) to show what categories the agent is tracking

4. **Check `docs/solutions/`** (managed by compound-engineering plugin). If it exists, count `.md` files per subdirectory and display a summary.

5. **Format as a readable summary.** Example output:

```
## Agent Expertise System

Config: max_lines=5000, 6 agents configured

### Mental Models

| Agent | Lines | Status | Tracking |
|-------|-------|--------|----------|
| ash-reviewer | 142 | active | patterns_discovered, architecture, open_questions |
| elixir-reviewer | 89 | active | patterns_discovered, codebase_observations |
| liveview-reviewer | 0 | empty | — |
| python-reviewer | 0 | empty | — |
| typescript-reviewer | 0 | empty | — |
| team-lead | 34 | active | project_patterns, workflow_observations |

### Institutional Knowledge (docs/solutions/)

12 solution docs across 5 categories:
  - runtime-errors/: 4 docs
  - best-practices/: 3 docs
  - database-issues/: 2 docs
  - test-failures/: 2 docs
  - build-errors/: 1 doc
```

## Important

This is a **read-only** command. Never modify any files. Only read and report.
