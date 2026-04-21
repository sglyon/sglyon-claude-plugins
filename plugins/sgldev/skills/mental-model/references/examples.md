# Mental Model Examples

These are realistic mental model files after several sessions in a hypothetical Phoenix/Ash app. Notice what's *not* here: no agent role, no analysis protocol, no generic best-practice prose.

## Example: ash-reviewer.md

```markdown
# Mental Model — ash-reviewer

## Repo Facts
- Ash 3.x throughout, with one holdout: `lib/myapp/legacy/order.ex` still on 2.x DSL.
- Auth: `Ash.Policy` on every resource except `lib/myapp/admin/*` (custom check module `MyApp.Admin.Checks.SuperUser`).
- Actor convention: actors are always `%MyApp.Accounts.User{}`, never `:system` (use `bypass: true` for system jobs).

## Gotchas
- `Ash.Changeset.manage_relationship :on_lookup` silently no-ops when the lookup returns >1 row. Add a unique constraint on lookup fields. (2026-04-15)
- `update_action` change in `lib/myapp/payments/payment.ex` reads from old record without a preparation; required relationship not loaded → match error in production. (2026-04-12)
- The `Order.read` action has `authorize?: false` — every caller must guard at the boundary. Currently 3 callers comply, 1 doesn't (`lib/myapp_web/live/order_live.ex:142`). (2026-04-08)

## Open Questions
- Should `Notification` resource get its own policy or inherit from `User`? Currently inherits — works but couples them.
- Is the custom CAS in `payments/cas.ex` intentional or pre-Ash holdover? (Ash has `lock_version` built in.)

## Recent Sessions
- 2026-04-20 — payments PR; flagged the CAS race in refunds.
- 2026-04-15 — user management PR; manage_relationship gotcha discovered.
- 2026-04-12 — preparations gap on payment update_action.
```

## Example: python-reviewer.md (early-stage repo)

```markdown
# Mental Model — python-reviewer

## Repo Facts
- Python 3.13 + uv for deps. `pyproject.toml` is canonical; no `requirements.txt`.
- API: FastAPI with DI for auth/db sessions in `src/api/deps.py`.
- Auth dep returns `User`, not a token object.

## Gotchas
- API handlers in `src/api/handlers/` return raw dicts instead of Pydantic response models. Convention drift; needs decision.

## Open Questions
- Are raw-dict returns intentional (latency) or accidental? Owner: @bb.

## Recent Sessions
- 2026-04-21 — first review session; baseline observations recorded.
```

## Example: team-lead.md

```markdown
# Mental Model — team-lead

## Repo Facts
- Test runner: `mix test --max-failures 1`.
- CI: `.github/workflows/ci.yml` (lint + dialyzer + test).
- Frontend assets built with `mix assets.deploy`; do not invoke `npm run build` directly.

## Workflow Patterns
- Splitting frontend/backend reviews keeps each reviewer agent under context limit on PRs >500 LOC.
- Compounder must run AFTER review; running in parallel produces shallow notes.
- The `learnings-researcher` adds value before architectural changes; skip it for typo fixes.

## Open Questions
- Should review and lint run in parallel? Currently sequential.

## Recent Sessions
- 2026-04-20 — payments PR (3 reviewers, 12 findings).
```

## Bad example (what NOT to write)

This is the kind of content that should NOT appear in a model file:

```markdown
# Mental Model — ash-reviewer

## Role
I am an Ash reviewer with deep expertise in policies and actions...

## Analysis Protocol
1. Read the changeset
2. Verify policy coverage
3. ...

## Heuristics
- Always check for actor_present
- Look for missing negative tests
- ...
```

All of this is already in the agent definition. It's loaded into the agent's context every session whether the model file says it or not. Repeating it here just wastes the line budget.

## Update-not-append demonstration

### Session 1 writes:

```markdown
## Repo Facts
- Auth uses simple token middleware.
```

### Session 2 updates (does NOT append a second auth bullet):

```markdown
## Repo Facts
- Auth: `Ash.Policy` with role checks (`:admin`, `:member`, `:viewer`); custom check module `MyApp.Policies.RoleCheck`. Migrated from token middleware in 2026-04. Key files: `lib/myapp/policies/role_check.ex`, `lib/myapp/accounts/user.ex`.
```

The old bullet was *replaced*, not appended-to. The model now reflects current understanding instead of a contradicting log.
