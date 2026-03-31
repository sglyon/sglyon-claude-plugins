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

Each agent maintains a personal mental model file (`.expertise/models/<agent>.yaml`) that persists across sessions. Agents accumulate codebase-specific patterns, architectural observations, and learnings over time.

Designed to complement the [compound-engineering](https://github.com/EveryInc/compound-engineering-plugin) plugin — sgldev owns per-agent expertise while compound-engineering owns institutional knowledge (`docs/solutions/`).

**Setup in a project:**

```bash
bash $CLAUDE_PLUGIN_ROOT/scripts/init-expertise.sh
```

This creates `.expertise/` with empty model files for each agent. Models are git-tracked and grow as agents work on the project.

#### How It Works

The expertise system delivers instructions through two channels:

- **SessionStart hook** — Fires when a Claude Code session begins. Outputs the full expertise lifecycle instructions to the main session agent. This covers any agent used directly in conversation (including project-defined agents).
- **Agent system prompts** — Each plugin agent (the 5 reviewers) has a "Persistent Expertise" section baked into its `.md` file. This covers the subagent case (e.g., when team-lead spawns a reviewer), since there is no `SubagentStart` hook in Claude Code.

#### Using Expertise with Custom Project Agents

Any project can define its own agents in `.claude/agents/` and have them participate in the expertise system:

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

3. **Add the Persistent Expertise section** to your agent's `.md` file (required for subagents, since there is no `SubagentStart` hook):

```markdown
## Persistent Expertise

You maintain a personal mental model file at `.expertise/models/my-custom-agent.yaml`
in the project directory. This file persists across sessions and contains patterns,
observations, and learnings you've accumulated about this specific codebase.

**At task start:** Read your mental model file for context before doing any work.
**After completing work:** Update your mental model file with any new patterns
discovered, architectural observations, or open questions. Update stale entries
rather than just appending.

If the file doesn't exist or is empty, that's fine — you'll build it up over time.
```

If your custom agent is only used directly in conversation (not as a subagent), the SessionStart hook provides the instructions automatically and step 3 is optional.
