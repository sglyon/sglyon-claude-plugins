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

Personal development tools.

**Agents** (7):
- `sglyon-ash-reviewer` — Ash Framework code review
- `sglyon-elixir-reviewer` — Elixir code review
- `sglyon-liveview-reviewer` — Phoenix LiveView code review
- `sglyon-python-reviewer` — Python code review
- `sglyon-typescript-reviewer` — TypeScript code review
- `sglyon-code-health-auditor` — Dead code + duplication audit (uses `deadcode` and `jscpd`)
- `sgldev-plugin-releaser` — Release automation for the sgldev plugin

**Skills** (9):
- `chartroom` — Chart generation
- `showboat` — Demo document creation
- `team-lead` — Team lead workflows
- `rodney` — Browser automation via Chrome CDP
- `create-agent-skills` — Skill authoring toolkit
- `conversational-response` — Concise response style for multi-agent workflows
- `deadcode` — Multi-language dead-code detection (Python, JS/TS, Elixir, Go)
- `jscpd` — Copy/paste duplication detection across 150+ languages
- `arete-intelligence-sow` — Areté Intelligence branded Statement of Work generator
