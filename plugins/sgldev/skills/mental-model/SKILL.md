---
name: mental-model
description: "Defines the behavioral contract for reading, updating, and maintaining per-agent mental model files in .expertise/models/. Auto-activates when agents work with .expertise/ files, or when the user asks about mental models, agent knowledge, or expertise."
---

# Mental Model Management

You maintain a personal mental model file at `.expertise/models/<your-agent-name>.md` in the project directory. This file persists across sessions and accumulates **repo-specific facts you could not have known without working in this codebase**.

## Lifecycle

### At task start
Read your mental model file. Use it as context — patterns previously discovered, conventions specific to this repo, open questions from prior sessions.

### Before drafting your final reply
Update your mental model file with new findings from this session. Do this *before* composing your reply, not after.

### Then deliver your full reply
The expertise file is a side effect; your reply to the lead is the primary output. Never truncate your reply to make room for the update — the lead agent depends on what you return.

## What to write (DO)

- Concrete file paths (`lib/arilearn/payments/charge.ex`)
- Enum values, schema constants, magic strings used by this codebase
- Non-obvious architectural facts (e.g., "this app uses Ash 3.x but resource X still uses 2.x DSL")
- Bugs you hit and how the codebase actually behaves vs. how you expected it to behave
- Conventions specific to this repo that contradict generic best practice
- Open questions you couldn't resolve and where to look next time

## What NOT to write (DON'T)

- **Your role, purpose, heuristics, or analysis protocol.** Those live in your agent definition and are loaded fresh every session. Repeating them in the model file wastes lines and adds no value.
- **Generic best-practice prose** ("always validate inputs", "prefer composition over inheritance"). True everywhere; project-specific value: zero.
- **The findings of the current task.** Those go in your reply to the lead. The mental model captures *durable* facts about the repo, not transient analysis.
- **Build output, test logs, transcripts, or copy-pasted file contents.** Reference paths instead.

## Writing rules

1. **Update stale entries; don't append.** If your understanding changes, edit the existing entry. Don't let contradictions accumulate.
2. **Reference files by path.** Write `key_files: lib/myapp/orders.ex`, not the file contents.
3. **Only update YOUR file.** Never write to another agent's mental model.
4. **Use ISO dates.** `2026-04-21`.

## Format

Free-form markdown. Suggested headings:

```markdown
## Repo Facts
## Gotchas
## Open Questions
## Recent Sessions
```

`init-expertise.sh` creates a starter file with these headings. Adapt to your domain — structure emerges from use.

## Line limit

Configurable in `.expertise/config.yaml` (default: 5,000 lines). A PostToolUse hook fails the write when you exceed it. If you're approaching the limit:

- Remove entries no longer accurate
- Consolidate related observations
- Drop low-value entries (trivial patterns, things obvious from the code)
- Keep high-value entries (gotchas, architectural decisions, footguns)

## Reference

- `references/examples.md` — concrete example mental models
- `references/schema-guide.md` — suggested heading structures per agent role
