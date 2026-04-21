# Mental Model Schema Guide

Mental model files are free-form markdown. These are suggested heading structures by agent role — adapt them to the specific repo. Agents evolve their own structure over time.

**Reminder:** the model file captures *repo-specific facts the agent definition doesn't already know*. Don't restate the agent's role, heuristics, or analysis protocol — those are loaded fresh every session.

## Review agents (ash, elixir, liveview, python, typescript)

```markdown
# Mental Model — <agent-name>

## Repo Facts
- `lib/myapp/payments/charge.ex` is the canonical Stripe handler.
- Resource statuses: `[:pending, :paid, :refunded, :voided]`.
- Auth uses `Ash.Policy` everywhere except `lib/myapp/admin/` (custom check module).

## Gotchas
- `User.create` action skips authorization on the test seed path. (2026-04-12)
- `manage_relationship :on_lookup` silently no-ops if the lookup returns >1 row. (2026-04-15)

## Open Questions
- Why does the notification resource bypass the parent policy?

## Recent Sessions
- 2026-04-20 — reviewed payments PR, found CAS race in refunds.
- 2026-04-15 — reviewed user management; flagged seed-path auth skip.
```

## Team lead

```markdown
# Mental Model — team-lead

## Repo Facts
- Test runner: `mix test --max-failures 1` is the project default.
- CI gating job is `lint + dialyzer + test` in `.github/workflows/ci.yml`.

## Workflow Patterns
- Splitting frontend vs backend reviews keeps reviewer agents focused; combined runs hit context limits on large PRs.
- The compounder agent should run AFTER review, not in parallel — it depends on review findings.

## Open Questions
- Does spawning learnings-researcher before the brainstorm help or distract?

## Recent Sessions
- 2026-04-20 — orchestrated payments PR review (3 agents, ~12 findings).
```

## Researcher / explorer agents

```markdown
# Mental Model — repo-research-analyst

## Repo Facts
- Conventions doc lives at `docs/conventions/` (not `CONVENTIONS.md` at root).
- Module naming: `MyApp.<Context>.<Resource>` for Ash, `MyAppWeb.<Page>Live` for LiveView.

## Search Hints
- `lib/myapp/jobs/` — Oban workers (named `*Worker`)
- `priv/repo/migrations/` — migrations only; backfills live in `priv/repo/backfills/`

## Open Questions
- (none currently)
```

## Field guide

| Heading | Use for |
|---------|---------|
| `Repo Facts` | Stable, factual statements about the codebase |
| `Gotchas` | Things that surprised you; non-obvious behavior; bugs you hit |
| `Open Questions` | Unresolved items for next session |
| `Recent Sessions` | One-line log: date + what was touched. Keep last ~10. |
| `Workflow Patterns` (lead-only) | Orchestration choices that worked or didn't |
| `Search Hints` (researcher-only) | Where things live in this repo |
