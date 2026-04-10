# sgldev

Spencer Lyon's personal development tools for Claude Code. Includes 7 agents, 11 skills, and 5 hooks that power a persistent per-agent expertise system.

## Agents

| Agent | Description |
|-------|-------------|
| `sglyon-ash-reviewer` | Ash Framework code review (policies, actions, state machines) |
| `sglyon-elixir-reviewer` | Elixir code review (runtime safety, process correctness, BEAM pitfalls) |
| `sglyon-liveview-reviewer` | Phoenix LiveView code review (forms, uploads, PubSub, streams) |
| `sglyon-python-reviewer` | Python code review (Pythonic patterns, type safety, conventions) |
| `sglyon-typescript-reviewer` | TypeScript code review (type safety, modern patterns) |
| `sglyon-code-health-auditor` | Dead code and duplication scanning via deadcode + jscpd |
| `sgldev-plugin-releaser` | Release automation: audit, update docs, bump version, commit |

## Skills

| Skill | Description |
|-------|-------------|
| `chartroom` | Create charts from data files using the chartroom CLI |
| `showboat` | Create executable demo documents that prove an agent's work |
| `rodney` | Browser automation using the rodney CLI for Chrome |
| `create-agent-skills` | Guidance for creating and refining Claude Code Skills |
| `team-lead` | Multi-agent engineering workflow coordinator |
| `mental-model` | Behavioral contract for per-agent mental model files |
| `expertise` | Show status of the agent expertise system |
| `conversational-response` | Concise response style for multi-agent workflows |
| `jscpd` | Detect duplicated code across 150+ languages |
| `deadcode` | Find dead/unused code across Python, JS/TS, Elixir, Go |
| `arete-intelligence-sow` | Generate Arete Intelligence-branded SOW documents |

## Hooks

| Event | Type | Description |
|-------|------|-------------|
| `SessionStart` | command | Load expertise summary into main session context |
| `SubagentStart` | command | Inject expertise instructions into subagent via additionalContext |
| `SubagentStop` | prompt | Block subagents from stopping until they update their mental model (read-only agents exempted) |
| `PostToolUse` (Write/Edit) | command | Validate YAML syntax and line limits on .expertise/models/ files |
| `PreCompact` | command | Preserve expertise awareness across context compaction |

## Changelog

### v1.5.0

- Fix SubagentStop hook: use correct `{"decision": "block/allow"}` format, add `$ARGUMENTS`, safeguard read-only agents (Explore, Plan, claude-code-guide)
- Add `sgldev-plugin-releaser` agent for release automation
- Update plugin description to reflect 7 agents

### v1.4.0

- Add `sglyon-code-health-auditor` agent for dead code and duplication scans

### v1.3.0

- Added `deadcode`, `jscpd`, `arete-intelligence-sow` skills
- Added `team-lead` and `conversational-response` skills

### v1.2.0

- Initial expertise system with SessionStart, SubagentStart, SubagentStop, PostToolUse, and PreCompact hooks
- 5 code reviewer agents (Ash, Elixir, LiveView, Python, TypeScript)
- Core skills: chartroom, showboat, rodney, create-agent-skills, mental-model, expertise
