# deadcode Finding Schema Reference

Complete documentation of the JSON shape `deadcode scan --json` produces. Use this reference when parsing output or writing downstream tooling.

## Report envelope

```json
{
  "schema_version": "1",
  "summary": { ... },
  "findings": [ ... ],
  "ignored": [ ... ]
}
```

- **`schema_version`** — bumped on breaking changes. Consumers should branch on it. As of deadcode v0.7 this is `"1"`; it has not changed since v0.1 (all additions have been non-breaking).
- **`summary`** — see below.
- **`findings`** — always an array, never `null`. Empty on clean runs.
- **`ignored`** — only populated when `--show-ignored` is passed. Otherwise the summary carries the count.

## Summary

```json
{
  "languages": ["python", "typescript"],
  "files_scanned": 373,
  "findings_total": 16,
  "findings_ignored": 50,
  "tools_run": ["vulture", "knip"],
  "tools_unavailable": [],
  "ignore_file": "/abs/path/.deadcode-ignore.toml",
  "duration_ms": 1900
}
```

| Field | Type | Notes |
|---|---|---|
| `languages` | `[]string` | Sorted list of languages actually detected in scanned files |
| `files_scanned` | `int` | Source files walked, after skip-dirs filtering |
| `findings_total` | `int` | Equals `len(findings)`, surfaced for convenience |
| `findings_ignored` | `int` | Suppressed-by-ignore-file count; see `ignored[]` for details |
| `tools_run` | `[]string` | Adapters that actually executed (skipped adapters don't appear) |
| `tools_unavailable` | `[]string` | Human-readable reasons an adapter was skipped. Non-empty means silent gaps — surface to user |
| `ignore_file` | `string` | Absolute path to the discovered or explicit `.deadcode-ignore.toml`. Empty when `--no-ignore-file` |
| `duration_ms` | `int64` | Total scan duration |

## Finding

```json
{
  "id": "py:src/db/crud.py:206:unused_function:list_institutions",
  "file": "/Users/me/src/repo/src/db/crud.py",
  "line": 206,
  "end_line": 0,
  "symbol": "list_institutions",
  "kind": "unused_function",
  "language": "python",
  "tool": "vulture",
  "tools": ["vulture"],
  "confidence": 0.60,
  "message": "Function 'list_institutions' appears unused",
  "evidence": {
    "tool_raw": "src/db/crud.py:206: unused function 'list_institutions' (60% confidence)",
    "tool_confidence": "60%"
  },
  "fix_hint": "delete"
}
```

### id

Stable identifier with a **project-relative** path. Format:

```
<lang-prefix>:<project-relative-path>:<line>:<kind>:<symbol>
```

Portable across machines and shells — two developers running deadcode on the same project from different working directories produce identical IDs. Safe to commit in `.deadcode-ignore.toml` `id =` matchers.

Lang prefixes: `py` (Python), `js` (JavaScript/TypeScript), `ex` (Elixir), `go` (Go).

### file

**Absolute** path. Use this for reporting to users — editors and IDEs jump to `path:line` from absolute paths. Never use `id` for display; it's for ignore-file matching.

### line / end_line

1-indexed line numbers. `end_line` is optional (omitted or `0` when the adapter doesn't supply it).

### symbol

Best-effort identifier of the dead thing. Format varies by language:

- Python (vulture): bare name — `list_institutions`
- Elixir: fully qualified `Module.func/arity` — `Sample.Orphan.private_dead/0`
- Go (staticcheck): bare name — `unusedHelper`
- Go (xdeadcode): qualified `package.Name` — `main.unusedHelper` or `lib.DeadExport`
- TypeScript/JS (knip): bare name — `unusedExport`; for enum/class members, qualified — `MyEnum.OBSOLETE`, `MyClass.deadMethod`

When staticcheck and xdeadcode both flag the same Go function, the cross-tool dedupe in the runner keeps the longest symbol form (the qualified `main.X`) and records both tools in `tools`.

### kind — closed enum

```
unused_function
unused_method
unused_class
unused_type
unused_variable
unused_constant
unused_import
unused_export
unused_param
unused_field
unused_file
unreachable
unused_dependency
```

These are the only valid values. An unknown `kind` indicates an adapter bug.

Kind mapping per adapter:

| Adapter | Typical kinds |
|---|---|
| vulture (Python) | `unused_function`, `unused_method`, `unused_class`, `unused_variable`, `unused_import`, `unused_field`, `unreachable` |
| knip (JS/TS) | `unused_file`, `unused_export`, `unused_dependency`, `unused_field` (for class members) |
| elixir (mix compile) | `unused_function` (private only), `unreachable` (type-system findings), `unused_import`, `unused_variable` |
| staticcheck (Go) | `unused_function`, `unused_method`, `unused_type`, `unused_constant`, `unused_variable`, `unused_field` |
| xdeadcode (Go) | `unused_function` (functions/methods only — narrower scope than staticcheck) |

### language

One of: `python`, `javascript`, `typescript`, `elixir`, `go`. Matches the enum the runner uses for language detection.

### tool / tools

- **`tool`** — the primary adapter that produced the finding. For single-source findings equals `tools[0]`. For merged findings (after dedupe), equals the adapter that supplied the longest symbol.
- **`tools`** — full list of adapters that independently flagged this finding, sorted. Single-tool findings always have `tools == [tool]` for schema consistency. `len(tools) > 1` means cross-tool agreement — that's a high-signal confirmation.

### confidence

Normalized 0–1. Per-adapter mapping:

| Source | Native signal | Mapped |
|---|---|---|
| vulture | `60%`–`100%` native | divide by 100 |
| knip | binary present | `0.95` |
| elixir compiler | binary present | `0.90`–`0.95` (higher for type-system findings) |
| staticcheck | binary present | `0.95` |
| xdeadcode | binary present | `0.95` |

Cross-tool dedupe keeps `max(confidence)`.

### message

Human-readable description. Prefer this over constructing a new description when reporting to users.

### evidence

Map of per-adapter provenance data. Keys depend on the source tool. Common keys:

- `tool_raw` — original tool output line, for audit
- `tool_confidence` — vulture's native percentage string
- `tool_code` — staticcheck's check code (e.g. `U1000`)
- `tool_category` — knip's issue category (`files`, `exports`, `dependencies`, etc.)
- `elixir_phase` — `compiler_xref` or `type_checker`
- `mix_section` — which `mix compile` section the warning came from
- `package_path` — xdeadcode's Go package path

After cross-tool dedupe, evidence keys from different tools are prefixed: `staticcheck.tool_code`, `xdeadcode.package_path`. A `dedupe.tools_count` marker is added for diagnostics.

### fix_hint

Informational in v0.x — reserved for a future autofix mode. Values: `delete`, `make-private`, `inline`, `manual`.

## IgnoredFinding

Only present in `ignored[]` when `--show-ignored` is set. Wraps a `Finding` with two extra fields:

```json
{
  "id": "...",
  "file": "...",
  "... every Finding field ...",
  "ignore_reason": "Pydantic/SQLAlchemy field declarations",
  "matched_rule": 0
}
```

- **`ignore_reason`** — the `reason` field from the matched `.deadcode-ignore.toml` rule
- **`matched_rule`** — zero-based index of the rule that matched. Useful for auditing which rules are doing work vs. dead rules.

## Schema version policy

`schema_version` has been `"1"` since v0.1. All changes through v0.7 have been additive (new fields, never renamed or removed):

- v0.2: added `Summary.findings_ignored`, `Summary.ignore_file`, `Report.ignored[]`, `IgnoredFinding`
- v0.3: added `Kind.unused_file`
- v0.5: added `Kind.unused_type`
- v0.6: added `Finding.tools []string` (primary `tool` field preserved for back-compat)
- v0.6.1: added `Result.ScanRoots` (internal only, not in JSON)
- v0.6.2: changed `Finding.id` to use project-relative paths (breaking only for users matching by exact `id =` in committed ignore files)

A bump to `schema_version: "2"` would signal a truly breaking structural change. None planned.
