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

**Hooks** (6):
- **SessionStart** — Loads expertise system awareness when `.expertise/` exists in a project
- **SubagentStart** — Injects expertise instructions into every spawned subagent via `additionalContext`
- **SubagentStop** — Blocks subagents from stopping until they've updated their mental model (if meaningful work was done)
- **PostToolUse** (Write|Edit) — Validates YAML syntax and line limits for mental model files
- **PreCompact** — Preserves expertise awareness across context compaction
- **Stop** — Nudges main session agent to persist learnings before session ends

### Agent Expertise System

Each agent maintains a personal mental model file (`.expertise/models/<agent>.yaml`) that persists across sessions. Agents accumulate codebase-specific patterns, architectural observations, and learnings over time.

Designed to complement the [compound-engineering](https://github.com/EveryInc/compound-engineering-plugin) plugin — sgldev owns per-agent expertise while compound-engineering owns institutional knowledge (`docs/solutions/`).

**Requirements:** [uv](https://docs.astral.sh/uv/) (hook scripts use PEP 723 inline metadata to manage dependencies automatically via `uv run`)

**Setup in a project:**

```bash
bash $CLAUDE_PLUGIN_ROOT/scripts/init-expertise.sh
```

This creates `.expertise/` with empty model files for each agent. Models are git-tracked and grow as agents work on the project.

#### How It Works

The expertise system delivers instructions automatically via hooks — no manual setup in agent files needed:

- **SessionStart hook** — Fires when a Claude Code session begins. Injects expertise lifecycle instructions into the main session agent.
- **SubagentStart hook** — Fires when any subagent is spawned (e.g., team-lead spawning a reviewer). Injects the same expertise instructions into the subagent's context.

Both hooks run the same script, so every agent — plugin-provided or project-defined, main session or subagent — gets the full instructions automatically.

#### Using Expertise with Custom Project Agents

Any project can define its own agents in `.claude/agents/` and have them participate in the expertise system. No changes to the agent's `.md` file are needed — the SubagentStart hook handles instruction injection automatically.

1. **Add your agent to `.expertise/config.yaml`:**

```yaml
agents:
  - ash-reviewer
  - elixir-reviewer
  - liveview-reviewer
  - python-reviewer
  - typescript-reviewer
  - team-lead
  - my-custom-agent    # your agent
```

2. **Run the init script** to create the model file:

```bash
bash $CLAUDE_PLUGIN_ROOT/scripts/init-expertise.sh
```

That's it. The hooks handle the rest.
