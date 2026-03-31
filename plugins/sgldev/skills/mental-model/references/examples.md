# Mental Model Examples

## Example: Ash Reviewer (after a few sessions)

```yaml
patterns_discovered:
  - date: "2026-03-28"
    pattern: "Ash.Changeset.manage_relationship with on_lookup: :relate has a silent failure mode when the lookup returns multiple results"
    severity: high
    files:
      - lib/my_app/resources/order.ex
    prevention: "Always add unique constraint on lookup fields"

  - date: "2026-03-31"
    pattern: "The payments module uses update_action with a change that reads from the old record, but the old record isn't loaded with required relationships"
    severity: medium
    files:
      - lib/my_app/resources/payment.ex
    prevention: "Add preparations that load required relationships before changes run"

architecture:
  auth_layer:
    pattern: "Policy-based with actor checks via Ash.Policy"
    key_files:
      - lib/my_app/resources/user.ex
      - lib/my_app/policies/admin_policy.ex
    observations:
      - "Several resources missing negative authorization tests"
      - "Admin policy uses a custom check module rather than built-in expr"

  payments:
    pattern: "Custom CAS pattern instead of Ash's built-in optimistic locking"
    key_files:
      - lib/my_app/resources/payment.ex
      - lib/my_app/payments/cas.ex
    observations:
      - "CAS implemented via DB advisory locks, not Ash's lock_version"

codebase_observations:
  - date: "2026-03-31"
    note: "Test suite uses a shared factory module at test/support/factory.ex with Ash-aware helpers"

  - date: "2026-03-28"
    note: "Mix of Ash 3.x and 2.x patterns — some resources still use old DSL syntax"

open_questions:
  - "Should the notification resource use a separate policy or inherit from parent?"
  - "Is the custom CAS pattern intentional or should it migrate to Ash's optimistic locking?"
```

## Example: Python Reviewer (early stages)

```yaml
patterns_discovered:
  - date: "2026-03-31"
    pattern: "API handlers use raw dict returns instead of Pydantic response models"
    severity: medium
    files:
      - src/api/handlers/users.py
      - src/api/handlers/billing.py
    prevention: "Define response models in src/api/schemas/ and use them in handler return types"

architecture:
  api_layer:
    pattern: "FastAPI with dependency injection for auth and DB sessions"
    key_files:
      - src/api/main.py
      - src/api/deps.py
    observations:
      - "Auth dependency returns User model directly, not a token object"

codebase_observations:
  - date: "2026-03-31"
    note: "Project uses uv for dependency management with pyproject.toml"

open_questions:
  - "Are the raw dict returns intentional (speed) or should they all use Pydantic models?"
```

## Example: Update-Not-Append Across Sessions

### Session 1 writes:
```yaml
architecture:
  auth_layer:
    pattern: "Simple token-based auth"
    key_files:
      - lib/my_app/auth.ex
    observations:
      - "No role-based access control"
```

### Session 2 updates (not appends a second auth_layer entry):
```yaml
architecture:
  auth_layer:
    pattern: "Policy-based auth with role checks via Ash.Policy"
    key_files:
      - lib/my_app/auth.ex
      - lib/my_app/policies/role_check.ex
    observations:
      - "RBAC added in session 2 — three roles: admin, member, viewer"
      - "Role check uses a custom Ash.Policy.Check module"
```

The key insight: the `auth_layer` entry was **updated** to reflect the new understanding, not duplicated. The old "Simple token-based auth" description was replaced because it's no longer accurate.
