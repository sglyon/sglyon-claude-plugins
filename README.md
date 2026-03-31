# sglyon-claude-plugins

Spencer Lyon's Claude Code plugin marketplace.

## Installation

```bash
# Add the marketplace
/plugin marketplace add sglyon/sglyon-claude-plugins

# add a plugin from the marketplace
/plugin install sgldev
```

## Available Plugins

### sgldev

Personal development tools with persistent per-agent expertise.

**Agents** (5 specialized code reviewers with persistent mental models):
- `sglyon-ash-reviewer` — Ash Framework
- `sglyon-elixir-reviewer` — Elixir
- `sglyon-liveview-reviewer` — Phoenix LiveView
- `sglyon-python-reviewer` — Python
- `sglyon-typescript-reviewer` — TypeScript

**Skills** (8):
- `chartroom` — Chart generation
- `showboat` — Demo document creation
- `team-lead` — Team lead workflows
- `rodney` — Browser automation via Chrome CDP
- `create-agent-skills` — Skill authoring toolkit
- `mental-model` — Per-agent expertise lifecycle management
- `expertise` — Dashboard showing agent knowledge state
- `conversational-response` — Concise response style for multi-agent workflows

**Hooks** (3):
- **SessionStart** — Loads expertise system awareness when `.expertise/` exists in a project
- **PostToolUse** (Write|Edit) — Validates YAML syntax and line limits for mental model files
- **Stop** — Nudges agents to persist learnings before session ends

### Agent Expertise System

Each review agent maintains a personal mental model file (`.expertise/models/<agent>.yaml`) that persists across sessions. Agents accumulate codebase-specific patterns, architectural observations, and learnings over time.

Designed to complement the [compound-engineering](https://github.com/EveryInc/compound-engineering-plugin) plugin — sgldev owns per-agent expertise while compound-engineering owns institutional knowledge (`docs/solutions/`).

**Setup in a project:**

```bash
bash $CLAUDE_PLUGIN_ROOT/scripts/init-expertise.sh
```

This creates `.expertise/` with empty model files for each agent. Models are git-tracked and grow as agents work on the project.
