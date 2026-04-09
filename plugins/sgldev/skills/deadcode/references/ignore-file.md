# .deadcode-ignore.toml Reference

Full matcher semantics, resolution order, and worked examples. Read this when helping a user suppress false positives or debug why an ignore rule isn't matching.

## File location and discovery

The ignore file is named `.deadcode-ignore.toml` and lives at the repo root. `deadcode` discovers it by walking upward from the scan path, like `.gitignore`:

1. `--ignore-file <path>` — explicit, must exist (errors if missing)
2. Auto-discovery — walk up from the scan root until a `.deadcode-ignore.toml` is found
3. `--no-ignore-file` — disable loading entirely

## Rule shape

```toml
[[ignore]]
id = "py:src/foo.py:42:unused_function:legacy_handler"
file = "src/models/**.py"
symbol = "*_at"
kinds = ["unused_field", "unused_variable"]
languages = ["python"]
tools = ["vulture"]
reason = "Required documentation of why this is suppressed"
```

All fields are optional EXCEPT `reason` (which is required for documentation, not matching). At least one matcher field must be present — a rule with no matchers matches nothing and `deadcode ignore validate` flags it.

## Matcher semantics

A rule matches a finding when **every specified field** matches. Unspecified fields are wildcards.

| Field | Type | Match against | Notes |
|---|---|---|---|
| `id` | string | exact `Finding.id` | Most precise. Safe across machines since v0.6.2 (paths are project-relative). |
| `file` | glob | absolute path, project-relative path, scan-root-relative path, OR basename | Doublestar globs. See "file-glob roots" below. |
| `symbol` | glob | `Finding.symbol` | Doublestar globs. Works for `Module.func/arity` in Elixir. |
| `kinds` | list of strings | `Finding.kind` | Any-of match. Values must be from the closed kind enum. |
| `languages` | list of strings | `Finding.language` | Any-of. |
| `tools` | list of strings | `Finding.tool` | Any-of. Useful for suppressing one adapter's output without the other. |
| `reason` | string | (not matched) | **Required** for documentation. |

## File-glob roots

File globs are resolved against multiple candidate roots so the same ignore file works whether the user scans the whole repo or a subdirectory:

1. The absolute file path itself (for absolute globs)
2. The directory containing the ignore file (the repo root when committed at repo root)
3. Each scan path passed via CLI args
4. The detected project root for each scan path (nearest ancestor containing `.git`, `pyproject.toml`, `package.json`, `Cargo.toml`, or `go.mod`)
5. The basename (so `**.py` works anywhere)

A glob matches if **any** of these resolutions matches. False positives are extremely unlikely because all matchers on a rule must AND together.

## First-match-wins

Rules are evaluated in the order they appear in the TOML file. The first rule that matches a finding wins — subsequent rules are not considered for that finding. Order specific rules above general ones if attribution matters.

Use `--show-ignored` to see which rule suppressed which finding:

```bash
deadcode scan --json --show-ignored <path>
```

Each entry in the `ignored[]` array has `matched_rule` (zero-based index). Rules that never match at all are inert — the future `deadcode ignore stats` command will surface dead rules.

## Worked examples

### Python: Pydantic/SQLAlchemy fields

```toml
[[ignore]]
file = "src/models/**.py"
kinds = ["unused_field", "unused_variable"]
reason = "Pydantic/SQLAlchemy schema field declarations — used by ORM/serializer introspection"

[[ignore]]
symbol = "*_at"
languages = ["python"]
kinds = ["unused_variable"]
reason = "ORM timestamp columns (created_at, updated_at, etc.)"

[[ignore]]
symbol = "*_id"
languages = ["python"]
kinds = ["unused_variable"]
reason = "ORM foreign key columns"
```

Applied against a real Phoenix-style Python backend: reduced 137 raw findings → 16 (88% reduction), preserving the 1 real unused import and 4 genuinely dead CRUD functions.

### JavaScript/TypeScript: shadcn/ui false positives

shadcn/ui projects copy the full component library into `src/components/ui/` but only import what they currently use. knip flags the unused ones as dead AND cascades to flagging their `@radix-ui/*` peer deps as unused.

```toml
[[ignore]]
file = "src/components/ui/**"
kinds = ["unused_file", "unused_export"]
languages = ["typescript", "javascript"]
reason = "shadcn/ui primitives kept on hand for future use"

[[ignore]]
symbol = "@radix-ui/react-*"
kinds = ["unused_dependency"]
reason = "Transitive peer deps of shadcn/ui primitives"
```

Applied against a real React+shadcn frontend: 122 raw → 32 (90 suppressed), leaving only actual dead code like backup files and unwired components.

### Elixir: Phoenix controller actions

`deadcode`'s Elixir adapter already has a built-in default ignore list for Phoenix controller actions, GenServer callbacks, LiveView callbacks, Channel callbacks, Plug `call/2`, and Ecto `changeset/*`. Most projects don't need explicit rules for these. For project-specific patterns:

```toml
[[ignore]]
# Phoenix views are called from templates, not from code
file = "lib/*_web/views/**.ex"
kinds = ["unused_function"]
reason = "Phoenix view helpers invoked from .eex/.heex templates"

[[ignore]]
# Custom Plug in this project
symbol = "*.call/2"
languages = ["elixir"]
kinds = ["unused_function"]
reason = "Plug behaviour callbacks"
```

### Go: specific dead export

After verifying a flagged function is legitimately called via reflection:

```toml
[[ignore]]
id = "go:internal/dispatch/registry.go:42:unused_function:HandleReflectCall"
reason = "Registered via registerHandler() in init(); not statically visible"
```

Exact-ID matching is the most precise approach when the false positive is a single named thing rather than a pattern.

## Validation

```bash
deadcode ignore validate
deadcode ignore validate --file path/to/.deadcode-ignore.toml
```

The validator checks:

- Each rule has at least one matcher field
- Each rule has a non-empty `reason`
- All `kinds` values are from the closed kind enum
- Unknown keys are ignored (forward compatibility)

A rule with no matchers produces an error like:

```
rule 3: at least one matcher required (id/file/symbol/kinds/languages/tools)
```

## Listing

```bash
deadcode ignore list
deadcode ignore list --file path/to/.deadcode-ignore.toml
```

Prints all rules with their matchers and reasons. Useful for auditing what's suppressed and why.

## Interaction with cross-tool dedupe

Dedupe runs BEFORE the ignore-file pass, so user rules match the **merged form** of a finding:

- Merged `symbol` is the longest contributing symbol (most qualified)
- Merged `tool` is the adapter that supplied the longest symbol
- Merged `kind` is preserved (all contributing findings share the kind by definition)

Consequence: users matching by `symbol` should use glob patterns to catch both bare and qualified forms. A rule like `symbol = "*unusedHelper"` matches both `unusedHelper` (staticcheck) and `main.unusedHelper` (xdeadcode) post-merge.

Users matching by exact `id = "..."` should match against the post-merge ID, which uses the longest symbol. If uncertain, run `deadcode scan --json` and copy the `id` value verbatim from the output.

## Common mistakes

1. **Missing `reason`** — validation error. Every rule must document why it exists.
2. **Only using `languages`** — matches every finding in that language. Always combine with another matcher unless the intent is to suppress a whole language.
3. **Matching by `id` but with stale paths** — before v0.6.2, IDs could be cwd-dependent. Regenerate IDs from the current version by running `deadcode scan --json` and copying the current form.
4. **Expecting `file` to match relative CWD paths** — the resolution uses scan roots and project markers, not cwd. Use globs (`src/models/**`) rather than exact relative paths.
5. **Expecting `symbol` globs to match across path separators** — the glob library treats `/` as a separator. Symbols like `Module.func/arity` work because the `/` appears in the arity, which the glob handles correctly for patterns like `*.handle_call/3`.
