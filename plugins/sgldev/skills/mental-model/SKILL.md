---
name: mental-model
description: "Defines the behavioral contract for reading, updating, and maintaining per-agent mental model files in .expertise/models/. Auto-activates when agents work with .expertise/ files, or when the user asks about mental models, agent knowledge, or expertise."
---

# Mental Model Management

You maintain a personal mental model file at `.expertise/models/<your-agent-name>.yaml` in the project directory. This file persists across sessions and contains patterns, observations, and learnings you've accumulated about this specific codebase.

## Lifecycle

### At Task Start
Read your mental model file before doing any work. This gives you context about:
- Patterns you've previously discovered in this codebase
- Architectural decisions and conventions you've observed
- Open questions from prior sessions

### During Work
As you work, note patterns worth remembering — things that would help you (or another session of you) do better next time.

### After Completing Work
Update your mental model file with new learnings. This is the most important step.

## Writing Guidelines

1. **Update stale entries rather than just appending.** If your understanding of something has changed, update the existing entry. Don't let contradictory information accumulate.

2. **Reference files by path, don't copy content.** Write `key_files: [lib/my_app/resources/order.ex]` not the full file contents.

3. **Don't store transient data.** Build output, test results, error logs — these don't belong. Store only your conclusions and observations.

4. **Structure emerges naturally.** Don't force categories that don't fit your domain. Start with what makes sense and evolve the structure over sessions.

5. **Only update YOUR model file.** Never write to another agent's mental model. Each agent owns its own file.

6. **Use ISO dates.** Record when patterns were discovered: `date: "2026-03-31"`.

7. **Include severity/importance.** Not all observations are equal. Mark what matters most.

## Line Limit

Your mental model file has a configurable line limit (default: 5,000 lines, set in `.expertise/config.yaml`). A PostToolUse hook validates this after every write.

If you're approaching the limit:
- Remove entries that are no longer accurate
- Consolidate related observations
- Drop low-value entries (trivial patterns, things that are obvious from the code)
- Keep high-value entries (non-obvious patterns, gotchas, architectural decisions)

## YAML Best Practices

- Use spaces for indentation (never tabs)
- Quote strings that contain special characters (`:`, `#`, `{`, `}`, `[`, `]`)
- Use block scalars (`|` or `>`) for multi-line text
- Keep top-level keys descriptive and consistent

## Reference

- See `references/schema-guide.md` for suggested YAML structures per agent role
- See `references/examples.md` for concrete example mental models
