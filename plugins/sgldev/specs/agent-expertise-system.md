# Agent Expertise System — PRD & Implementation Plan

**Author:** SGL
**Date:** 2026-03-31
**Plugin:** sgldev
**Status:** Draft

---

## 1. Problem Statement

Today the sgldev plugin has 5 specialized review agents and a team-lead orchestration skill. Each agent encodes static expertise in its system prompt (e.g., sglyon-ash-reviewer knows 10 production bug patterns). But:

1. **Agents don't learn.** The Ash reviewer knows the same 10 patterns whether it's session 1 or session 100. Patterns discovered during reviews are lost when the session ends.
2. **Solved problems aren't captured.** When a tricky bug is diagnosed and fixed, that knowledge lives only in the conversation transcript — invisible to future sessions.
3. **No drift management.** As codebases evolve, documented patterns and solutions can become stale or contradictory. Nothing detects or corrects this.
4. **No cross-session context.** Each session starts from zero. Agents have no awareness of what was discussed, decided, or learned in prior sessions.

## 2. Goals

Build a compounding knowledge system into the sgldev plugin that:

- Gives each agent a **persistent, per-agent mental model** that grows across sessions
- Provides a structured way to **capture solved problems** as shared institutional knowledge
- Includes **drift detection and maintenance** to keep knowledge accurate over time
- Uses **hooks to enforce the lifecycle** (read at start, update before stop, validate on write)
- Integrates with the existing team-lead orchestration and review agents
- Adopts the best ideas from both **lead-agents** (per-agent expertise, composable behavioral skills) and **compound-engineering** (structured knowledge capture, schema validation, refresh workflows)

## 3. Non-Goals

- Multi-level delegation hierarchy (Orchestrator → Lead → Worker). Claude Code supports one level of subagents — we work within that.
- Hard domain locking (restricting which files agents can read/write). Nice in theory but not enforceable in Claude Code's permission model.
- Replacing the existing static expertise in agent system prompts. Mental models supplement the baked-in knowledge, they don't replace it.

## 4. Design Overview

### Two Knowledge Stores

| Store | Purpose | Format | Ownership | Audience |
|-------|---------|--------|-----------|----------|
| `.expertise/models/<agent>.md` | Per-agent working memory — repo-specific facts, gotchas, open questions | Free-form markdown | Each agent owns its own file | The agent itself |
| `docs/solutions/<category>/<slug>.md` | Institutional knowledge — solved problems, best practices | Structured markdown + YAML frontmatter | Created by `/compound` skill | All agents and humans |

### New Plugin Components

```
sgldev/
├── .claude-plugin/
│   └── plugin.json                    # Updated with new components
├── agents/                            # EXISTING (5 reviewers)
│   ├── sglyon-ash-reviewer.md         # Updated: add expertise refs
│   ├── sglyon-elixir-reviewer.md      # Updated: add expertise refs
│   ├── sglyon-liveview-reviewer.md    # Updated: add expertise refs
│   ├── sglyon-python-reviewer.md      # Updated: add expertise refs
│   ├── sglyon-typescript-reviewer.md  # Updated: add expertise refs
│   └── learnings-researcher.md        # NEW: searches docs/solutions/
├── skills/
│   ├── mental-model/                  # NEW: core expertise lifecycle
│   │   ├── SKILL.md
│   │   └── references/
│   │       ├── schema-guide.md        # Suggested YAML structures per role
│   │       └── examples.md            # Example mental models
│   ├── compound/                      # NEW: capture solved problems
│   │   ├── SKILL.md
│   │   └── references/
│   │       ├── schema.yaml            # Frontmatter schema
│   │       ├── category-map.md        # problem_type → directory mapping
│   │       └── template.md            # Solution doc template
│   ├── expertise/                     # NEW: /expertise dashboard
│   │   └── SKILL.md
│   ├── compound-refresh/              # NEW: drift detection & maintenance
│   │   ├── SKILL.md
│   │   └── references/
│   │       └── refresh-rules.md       # Keep/Update/Consolidate/Replace/Delete
│   ├── conversational-response/       # NEW: concise Slack-style responses
│   │   └── SKILL.md
│   ├── team-lead/                     # EXISTING (updated)
│   │   └── SKILL.md
│   ├── ... (other existing skills)
├── hooks/
│   ├── hooks.json                     # NEW: lifecycle enforcement
│   └── scripts/
│       ├── load-expertise.sh          # SessionStart: inject awareness
│       └── validate-expertise.sh      # PostToolUse: YAML + line checks
└── scripts/
    └── init-expertise.sh              # NEW: initialize .expertise/ for a project
```

## 5. Detailed Component Specs

### 5.1 Per-Agent Mental Models

**Location:** `.expertise/models/<agent-name>.md` in the project directory (not the plugin — these are per-project, per-agent).

**Initialization:** The `init-expertise.sh` script creates the directory structure and starter markdown files:

```
.expertise/
├── models/
│   ├── ash-reviewer.md
│   ├── elixir-reviewer.md
│   ├── liveview-reviewer.md
│   ├── python-reviewer.md
│   ├── typescript-reviewer.md
│   └── team-lead.md
└── config.yaml                  # max_lines, enabled agents, components
```

**Schema:** Free-form markdown. No enforced schema — agents evolve their own structure. The `mental-model` skill provides guidance and examples but doesn't mandate categories. Suggested top-level headings: `## Repo Facts`, `## Gotchas`, `## Open Questions`, `## Recent Sessions`. Example:

```markdown
# Mental Model — ash-reviewer

## Repo Facts
- Ash 3.x throughout; `lib/myapp/legacy/order.ex` still uses 2.x DSL.
- Auth: `Ash.Policy` everywhere except `lib/myapp/admin/*` (custom check module).

## Gotchas
- `manage_relationship :on_lookup` silently no-ops when lookup returns >1 row. Add unique constraint. (2026-04-15)

## Open Questions
- Is the custom CAS in `payments/cas.ex` intentional or pre-Ash holdover?

## Recent Sessions
- 2026-04-20 — payments PR; flagged refund CAS race.
```

**Critical writing rule:** the model file captures **repo-specific facts the agent could not have known without working in this codebase**. It must NOT restate the agent's role, heuristics, or analysis protocol — those live in the agent definition and are loaded fresh every session.

**Line Limit:** Configurable in `.expertise/config.yaml`, default 5,000 lines per agent.

**Lifecycle:**
1. **SessionStart hook** → injects a system message telling Claude that `.expertise/` exists and which agents have mental models, plus the writing instructions
2. **SubagentStart hook** → injects the same context into spawned subagents
3. **Subagent reads** its model file at task start
4. **Subagent does work** → discovers facts, observations
5. **Subagent updates** its model file *before* drafting its final reply (not after)
6. **PostToolUse hook** → enforces line limit and rejects stale `.yaml` writes after any write to `.expertise/models/`

### 5.2 Mental Model Skill

**Trigger:** Auto-activates when agents work with `.expertise/` files, or when user asks about "mental model", "expertise", "agent knowledge", "what does the reviewer know".

**Purpose:** Defines the behavioral contract for reading, updating, and maintaining mental model files. This is the Claude Code equivalent of lead-agents' `mental-model.md` skill.

**Key Instructions (adapted from lead-agents):**

- Read your expertise file at the start of every task for context
- Update after completing meaningful work — capture what you learned
- When understanding changes, update stale entries — don't just append
- Reference files by path, don't copy content
- Don't store transient data (build output, test results) — only conclusions
- After every write: validate YAML, check line count, trim if over limit
- Structure emerges naturally — don't force categories that don't fit your domain

### 5.3 Compound Skill (`/compound`)

**Trigger:** User invokes `/compound` after solving a problem, or asks to "document this solution", "capture this learning", "compound this".

**Purpose:** Captures a solved problem as structured institutional knowledge in `docs/solutions/`. Adapted from compound-engineering's `ce:compound` but simplified for single-agent use (no parallel subagent phases — Claude Code's main agent handles the full workflow).

**Workflow:**

1. **Extract** — Analyze conversation history to identify the problem, symptoms, root cause, and solution
2. **Classify** — Determine problem type (bug track vs knowledge track) and category using the schema
3. **Check for duplicates** — Search `docs/solutions/` for existing docs covering the same problem. If high overlap, update existing doc instead of creating new one
4. **Write** — Create `docs/solutions/<category>/<slug>-<date>.md` with YAML frontmatter and structured body
5. **Discoverability** — Check if project's CLAUDE.md mentions `docs/solutions/`. If not, suggest adding a line

**Schema (adapted from compound-engineering, made technology-agnostic):**

The compound-engineering schema is Rails-specific (component enum includes `rails_model`, `hotwire_turbo`, etc.). Our schema should be technology-agnostic with project-configurable component values.

Required fields (both tracks):
- `title` — clear problem title
- `date` — YYYY-MM-DD
- `module` — area affected (free-form string)
- `problem_type` — enum (see below)
- `severity` — critical / high / medium / low
- `tags` — array of lowercase, hyphen-separated keywords

Bug track additional required fields:
- `symptoms` — array of observable errors/behaviors (1-5 items)
- `root_cause` — free-form string (not enum — technology-agnostic)
- `resolution_type` — enum: code_fix, config_change, test_fix, dependency_update, migration, workflow_improvement, documentation_update

Knowledge track: no additional required fields beyond shared ones. Optional: `applies_when`, `symptoms`, `root_cause`, `resolution_type`.

Problem type enum (determines track):
- Bug track: `build_error`, `test_failure`, `runtime_error`, `performance_issue`, `database_issue`, `security_issue`, `ui_bug`, `integration_issue`, `logic_error`
- Knowledge track: `best_practice`, `documentation_gap`, `workflow_issue`, `developer_experience`

Category mapping (problem_type → directory): same as compound-engineering.

**Template:**

Bug track body sections: Problem, Symptoms, What Didn't Work, Solution, Why This Works, Prevention, Related Issues.

Knowledge track body sections: Context, Guidance, Why This Matters, When to Apply, Examples, Related.

### 5.4 Compound Refresh Skill (`/compound-refresh`)

**Trigger:** User invokes `/compound-refresh`, or asks to "refresh learnings", "check for stale docs", "maintain solutions".

**Purpose:** Scans `docs/solutions/` for drift, staleness, and duplication. Adapted from compound-engineering's `ce:compound-refresh` but simplified.

**Five Outcomes:**

| Outcome | When | Action |
|---------|------|--------|
| **Keep** | Still accurate | No edit |
| **Update** | Core solution valid, references drifted | In-place edits |
| **Consolidate** | Two+ docs overlap heavily | Merge into canonical, delete subsumed |
| **Replace** | Old guidance now misleading | Create successor, delete old |
| **Delete** | Code/problem domain gone | Delete (git preserves history) |

**Workflow:**

1. **Scope** — Find all `.md` in `docs/solutions/` (optionally filtered by category, module, or tags)
2. **Investigate** — For each doc, cross-reference claims against current codebase (file paths exist? solution matches current code? examples still valid?)
3. **Classify** — Assign one of 5 outcomes per doc
4. **Ask** (interactive mode) or **Mark stale** (autofix mode) for ambiguous cases
5. **Execute** — Apply chosen actions
6. **Report** — Summary of what was kept/updated/consolidated/replaced/deleted

### 5.5 Learnings Researcher Agent

**Purpose:** Autonomous subagent that searches `docs/solutions/` for relevant past solutions. Spawned by other agents/skills when institutional knowledge might be relevant.

**Trigger:** Use when implementing features in documented domains, debugging symptoms that might match past solutions, or before making architectural decisions.

**Search Strategy (adapted from compound-engineering):**

1. Extract keywords from the task description
2. Grep `docs/solutions/` by frontmatter fields (module, tags, problem_type, title)
3. Read frontmatter of matched candidates (first 30 lines)
4. Score relevance by field overlap
5. Full-read only strong/moderate matches
6. Return distilled summaries with file paths, key insights, and recommendations

**Integration with team-lead:** The team-lead skill's Phase 0 (Assessment) should spawn the learnings-researcher to check for relevant prior solutions before planning implementation.

### 5.6 Conversational Response Skill

**Trigger:** Auto-activates when agents are responding in multi-agent workflows (team-lead orchestration).

**Purpose:** Adapted from lead-agents' `conversational-response.md`. Keeps agent responses concise and chat-appropriate:

- Default to concise (3-8 sentences in chat)
- Push detailed output to files (specs, analyses, code)
- Reference rather than repeat prior work
- Signal what you did after writing a file (path, one-line summary)

### 5.7 Hooks

#### SessionStart Hook (Command)

**Script:** `hooks/scripts/load_expertise.py`

**What it does:**
1. Checks if `.expertise/` directory exists in current project
2. Lists all mental model `.md` files with line counts
3. Checks if `docs/solutions/` exists and how many solution docs it contains
4. Outputs a system message summarizing what expertise is available, plus the writing instructions

**Output example:**
```
Agent expertise system is active for this project.

Mental models available:
  - ash-reviewer.md (142 lines)
  - elixir-reviewer.md (89 lines)
  - python-reviewer.md (empty)

Institutional knowledge: docs/solutions/ contains 23 documented solutions.

[plus the EXPERTISE_INSTRUCTIONS block from expertise.py]
```

#### SubagentStart Hook (Command)

**Script:** `hooks/scripts/inject_expertise.py`

**What it does:** same content as SessionStart, but emits via `hookSpecificOutput.additionalContext` so the spawned subagent has the context.

#### PostToolUse Hook (Command)

**Matcher:** `Write|Edit`

**Script:** `hooks/scripts/validate_expertise.py`

**What it does:**
1. Checks if the written/edited file is inside `.expertise/models/`
2. If the file extension is `.yaml`, exits 2 with a message telling Claude to use `.md` (legacy migration nudge)
3. If `.md`: counts lines and reads `max_lines` from `.expertise/config.yaml`. If over limit, exits 2 with stderr asking Claude to trim
4. Otherwise exits 0

Note: PostToolUse cannot block the write (the file already exists when the hook fires). Exit 2 surfaces stderr to Claude so it can correct on the next turn.

#### No SubagentStop or PreCompact hooks

Earlier versions of this plugin used a `SubagentStop` prompt hook to block subagents from stopping until they updated their model file, and a `PreCompact` hook to inject context before compaction.

Both were removed in v1.6.0:

- **SubagentStop blocking** caused subagents to truncate their final reply in favor of writing to the expertise file, leaving the lead agent with no useful return value. The behavior is now expressed as instruction in `SubagentStart` context: *update before drafting your reply, then deliver the full reply*.
- **PreCompact has no context-injection channel** per the [hooks docs](https://code.claude.com/docs/en/hooks) — only `decision: "block"`. The previous `preserve_expertise.py` script printed text to stdout that was silently discarded.

### 5.8 Agent System Prompt Updates

Agent system prompts do **not** need explicit expertise references — the SessionStart and SubagentStart hooks inject the full instructions into every agent's context. This keeps the per-agent definitions focused on domain expertise and avoids duplicating the lifecycle instructions in five places.

### ~~5.9 Conversation Log~~ (Removed)

**Decision:** No conversation log. Separation of concerns — agents stay focused on their domain expertise and the current task. Cross-session context comes from mental models (per-agent observations) and `docs/solutions/` (institutional knowledge). Adding a shared conversation log would blur agent focus and create a noisy shared channel that dilutes the value of both existing knowledge stores.

### 5.10 Init Script

**Script:** `scripts/init-expertise.sh`

**Invocation:** User runs manually or via a `/init-expertise` command.

**What it does:**
1. Creates `.expertise/` directory structure
2. Creates starter `.md` files for each configured agent (with `## Repo Facts`, `## Gotchas`, `## Open Questions`, `## Recent Sessions` headings and DO/DON'T scaffolding)
3. Creates `config.yaml` with defaults
4. Both `.expertise/` and `docs/solutions/` are git-tracked (committed to the repo)
5. Suggests adding a line to project's CLAUDE.md about the expertise system if not already present

**Config defaults (`.expertise/config.yaml`):**
```yaml
max_lines: 5000
agents:
  - ash-reviewer
  - elixir-reviewer
  - liveview-reviewer
  - python-reviewer
  - typescript-reviewer
  - team-lead
```

## 6. Integration with Existing Components

### team-lead Skill

The team-lead orchestration skill gets these updates:

1. **Phase 0 (Assessment):** Spawn `learnings-researcher` agent to check `docs/solutions/` for relevant prior work before planning
2. **Phase 3 (Compound):** The existing compounder subagent now uses the `/compound` skill's schema and writes to `docs/solutions/` instead of ad-hoc documentation
3. **All phases:** Agents read their mental models at start, update at end

### Review Agents

Each reviewer's system prompt gets the "Persistent Expertise" section (5.8). This means:
- The Ash reviewer remembers that this project's payments module uses a custom CAS pattern
- The Elixir reviewer remembers that this project's GenServers use a specific supervision tree structure
- The LiveView reviewer remembers which components have known streaming issues

### Cross-Session Context

There is no shared conversation log. Cross-session awareness comes from two sources:
- **Mental models** — each agent's `.expertise/models/<agent>.yaml` captures observations and patterns specific to their domain
- **`docs/solutions/`** — the learnings-researcher agent searches institutional knowledge when relevant

This separation keeps agents focused on their domain rather than processing a noisy shared channel.

## 7. Implementation Phases

### Phase 1: Foundation (Core infrastructure)

**Deliverables:**
- [ ] `.expertise/` directory structure and `config.yaml` schema
- [ ] `scripts/init-expertise.sh` initialization script
- [ ] `hooks/hooks.json` with SessionStart, PostToolUse, and Stop hooks
- [ ] `hooks/scripts/load-expertise.sh`
- [ ] `hooks/scripts/validate-expertise.sh`
- [ ] `skills/mental-model/SKILL.md` and references
- [ ] Updated system prompts for all 5 review agents (add expertise refs)
- [ ] `skills/expertise/SKILL.md` — `/expertise` dashboard skill
- [ ] Updated `plugin.json` manifest

**Validates:** Agents can read/write mental models, hooks enforce lifecycle, YAML validation works, `/expertise` shows system state.

### Phase 2: Knowledge Capture

**Deliverables:**
- [ ] `skills/compound/SKILL.md` and all references (schema, category map, template)
- [ ] `agents/learnings-researcher.md`
- [ ] Updated `skills/team-lead/SKILL.md` (integrate learnings-researcher in Phase 0, compound skill in Phase 3)

**Validates:** Solved problems are captured in `docs/solutions/` with correct schema. Learnings researcher finds relevant prior solutions.

### Phase 3: Maintenance & Polish

**Deliverables:**
- [ ] `skills/compound-refresh/SKILL.md` and references
- [ ] `skills/conversational-response/SKILL.md`
- [ ] End-to-end testing of full workflow: init → work → capture → refresh

**Validates:** Drift detection works. Stale docs are identified and maintained.

## 8. Schema Reference

### Solution Document Frontmatter

```yaml
# Required (both tracks)
title: "Clear problem title"
date: "2026-03-31"
module: "payments"
problem_type: "runtime_error"          # Determines track
severity: "high"                        # critical/high/medium/low
tags: ["stripe", "webhooks", "idempotency"]

# Required (bug track only)
symptoms:
  - "Duplicate charges appearing in production"
  - "Webhook endpoint returning 500 on retry"
root_cause: "Missing idempotency key check on webhook handler"
resolution_type: "code_fix"

# Optional (both tracks)
related_components: ["billing", "webhooks"]

# Optional (knowledge track)
applies_when:
  - "Implementing webhook handlers for payment providers"

# Added by refresh
status: "stale"                         # Only if marked stale
stale_reason: "Payment module refactored to use new Stripe SDK"
stale_date: "2026-04-15"
last_updated: "2026-04-15"             # If refreshed
supersedes: "old-filename.md"           # If replacement
```

### Problem Type → Category Directory

| problem_type | Directory |
|---|---|
| build_error | docs/solutions/build-errors/ |
| test_failure | docs/solutions/test-failures/ |
| runtime_error | docs/solutions/runtime-errors/ |
| performance_issue | docs/solutions/performance-issues/ |
| database_issue | docs/solutions/database-issues/ |
| security_issue | docs/solutions/security-issues/ |
| ui_bug | docs/solutions/ui-bugs/ |
| integration_issue | docs/solutions/integration-issues/ |
| logic_error | docs/solutions/logic-errors/ |
| developer_experience | docs/solutions/developer-experience/ |
| workflow_issue | docs/solutions/workflow-issues/ |
| best_practice | docs/solutions/best-practices/ |
| documentation_gap | docs/solutions/documentation-gaps/ |

### Mental Model Config (`.expertise/config.yaml`)

```yaml
max_lines: 5000
agents:
  - ash-reviewer
  - elixir-reviewer
  - liveview-reviewer
  - python-reviewer
  - typescript-reviewer
  - team-lead
solutions:
  schema_version: "1.0"
  components: []                        # Project-configurable, e.g.: [ash_resource, liveview, genserver, oban_worker]
```

## 9. Resolved Decisions

1. **Mental models are git-tracked.** Both `.expertise/` and `docs/solutions/` are committed to the repo. Mental models are part of the codebase and how it is operated — they should ship with the project.

2. **No SubagentStop blocking.** Earlier versions blocked subagents from stopping until they updated their model file. In practice this caused subagents to truncate their actual reply in favor of writing to the file, leaving the lead with no useful return value. Now expressed as instruction in `SubagentStart` context: *update before drafting your reply*. PostToolUse still enforces line limit.

3. **No conversation log.** Separation of concerns — agents stay focused on their domain. Cross-session context comes from mental models (per-agent) and `docs/solutions/` (shared institutional knowledge). No shared conversation channel.

4. **Yes, add `/expertise` dashboard command in Phase 1.** Read-only command that shows mental model file sizes, last-modified dates, and solution doc counts by category. Cheap to build, high visibility for debugging and onboarding.

5. **Component enum is project-configurable with no defaults.** `.expertise/config.yaml` has a `components` list the user populates for their project. If not configured, `component` in solution frontmatter is a free-form string (still required, just not enum-validated). Each project defines its own vocabulary.
