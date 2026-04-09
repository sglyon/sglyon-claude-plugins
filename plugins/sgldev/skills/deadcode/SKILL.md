---
name: deadcode
description: This skill should be used when the user asks to "find dead code", "scan for unused code", "detect unused functions", "find unused exports", "audit for dead code", "run deadcode", "check unused dependencies", "find unused files", "find unused imports", or mentions the deadcode CLI. Supports Python (vulture), JavaScript/TypeScript (knip), Elixir (mix compile + set-theoretic type system), and Go (staticcheck + x/tools/cmd/deadcode) via a single unified CLI, schema, and ignore file. Complements the jscpd skill (duplication); deadcode is dead-code-only.
---

# deadcode: Multi-Language Dead-Code Detection

`deadcode` is an orchestrator over the best-in-class per-language dead-code tools. It runs the right analyzer for every file, normalizes output to a single `Finding` schema, and emits agent-friendly JSON. One CLI, one ignore file, one schema across Python, JavaScript/TypeScript, Elixir, and Go.

Source: <https://github.com/sglyon/deadcode>

## Setup Check

```bash
command -v deadcode >/dev/null 2>&1 && deadcode --version || echo "NOT INSTALLED"
```

If `deadcode` itself is not installed, install it before proceeding:

```bash
# Option 1: one-liner (recommended — no Go toolchain needed)
curl -sSL https://raw.githubusercontent.com/sglyon/deadcode/main/install.sh | sh

# Option 2: go install (requires Go toolchain)
go install github.com/sglyon/deadcode@latest

# Custom install dir (no sudo)
curl -sSL https://raw.githubusercontent.com/sglyon/deadcode/main/install.sh | INSTALL_DIR=$HOME/.local/bin sh
```

After installing, run `deadcode doctor` to check adapter availability:

```bash
deadcode doctor
```

`deadcode doctor` reports each built-in adapter as `OK` or `MISSING` with an install hint. Each adapter wraps an external tool that must be installed separately:

| Adapter | Language | Install |
|---|---|---|
| `vulture` | Python | `pip install vulture` or `uv tool install vulture` |
| `knip` | JavaScript/TypeScript | `npm install -g knip` (auto-falls back to `npx -y knip`) |
| `elixir` | Elixir | Install Elixir ≥ 1.18 via `brew install elixir` or elixir-lang.org |
| `staticcheck` | Go | `go install honnef.co/go/tools/cmd/staticcheck@latest` |
| `xdeadcode` | Go (second source) | `go install golang.org/x/tools/cmd/deadcode@latest` |

When `doctor` shows MISSING adapters, surface the specific install command to the user rather than proceeding silently — scans against a missing-adapter language will silently produce zero findings for that language.

## Core Workflow

Agent-default invocation: silent run, JSON to a temp file, then parse it.

```bash
deadcode scan --json --output /tmp/deadcode.json <path>
```

Then use the `Read` tool on `/tmp/deadcode.json` and parse the structured output. This is the canonical pattern — `--json` is agent-friendly, the temp file keeps stdout clean, and the JSON schema is stable.

For polyglot scans, pass a single project root and let the walker detect languages:

```bash
deadcode scan --json --output /tmp/deadcode.json ~/src/my-monorepo
```

The scan detects `.py`, `.ts`/`.tsx`/`.js`/`.jsx`, `.ex`/`.exs`, and `.go` files, skips common vendor/build directories (`node_modules`, `_build`, `deps`, `vendor`, `testdata`, etc.), and runs every applicable adapter in parallel.

## Finding Schema (compact)

The JSON output shape. Every field agents will need for parsing and reporting:

```json
{
  "schema_version": "1",
  "summary": {
    "languages": ["python", "typescript"],
    "files_scanned": 373,
    "findings_total": 16,
    "findings_ignored": 50,
    "tools_run": ["vulture", "knip"],
    "tools_unavailable": [],
    "ignore_file": "/abs/path/.deadcode-ignore.toml",
    "duration_ms": 1900
  },
  "findings": [
    {
      "id": "py:src/db/crud.py:206:unused_function:list_institutions",
      "file": "/Users/me/src/repo/src/db/crud.py",
      "line": 206,
      "symbol": "list_institutions",
      "kind": "unused_function",
      "language": "python",
      "tool": "vulture",
      "tools": ["vulture"],
      "confidence": 0.60,
      "message": "Function 'list_institutions' appears unused",
      "evidence": { "tool_raw": "src/db/crud.py:206: unused function ..." },
      "fix_hint": "delete"
    }
  ]
}
```

Key fields:

- **`id`** — stable identifier with a project-relative path. Safe to reference across machines and shells. Use in `.deadcode-ignore.toml` `id =` matchers.
- **`file`** — absolute path. Use this for reporting `path:line` to users (editors can jump to it).
- **`kind`** — closed enum: `unused_function`, `unused_method`, `unused_class`, `unused_type`, `unused_variable`, `unused_constant`, `unused_import`, `unused_export`, `unused_param`, `unused_field`, `unused_file`, `unreachable`, `unused_dependency`.
- **`confidence`** — normalized 0–1. Group findings ≥ 0.85 as high-confidence.
- **`tools`** — array of every adapter that flagged this finding. `len > 1` means multi-tool agreement (higher confidence).
- **`tools_unavailable`** — non-empty means an adapter was skipped. Surface this to the user as "install X for better coverage."

For the full schema including `Evidence` key conventions, IgnoredFinding, and `fix_hint` semantics, see `references/finding-schema.md`.

## Commands

```bash
deadcode scan [path...]          # scan; default path is "."
deadcode doctor                  # check adapter availability
deadcode adapters                # list built-in adapters
deadcode ignore list             # print rules in the discovered ignore file
deadcode ignore validate         # validate the ignore file
```

## Key Scan Flags

| Flag | Purpose |
|---|---|
| `--json` | Emit JSON (preferred for agents; overrides `--markdown` and `--pretty`) |
| `--markdown` | CommonMark report for PR descriptions, Slack, GitHub issues |
| `--pretty=auto\|always\|never` | Lipgloss styled terminal output. Auto enables on TTYs. |
| `-o, --output <path>` | Write report to file instead of stdout |
| `--lang <list>` | Restrict to languages (e.g. `python,go`) |
| `--kind <list>` | Restrict to kinds (e.g. `unused_function,unused_import`) |
| `--min-confidence <f>` | Drop findings below this confidence (0.0–1.0) |
| `--exclude-tests` | Drop findings whose only callers are tests |
| `--ignore-file <path>` | Explicit `.deadcode-ignore.toml` (default: walk up from scan root) |
| `--no-ignore-file` | Disable ignore-file loading entirely |
| `--show-ignored` | Include suppressed findings (with rule attribution) |
| `--threshold <n>` | Fail if findings exceed N |
| `--exit-code <n>` | Exit code when threshold exceeded (for CI gating) |

## Reporter Modes — When To Use Each

- **`--json`** — Always prefer this for programmatic use. Schema-stable, parseable, includes every field.
- **`--markdown`** — Use when producing output for a PR description, GitHub issue, or Slack message. Per-language sections, tables, `<details>` fold for ignored findings.
- **`--pretty=always`** — Use when showing the user a styled terminal report. Auto-enabled on TTYs. Not appropriate for piped output (use `--json` instead).
- **Default (console)** — Plain text, matches the v0.1 output. Safe fallback.

The precedence chain is `--json` > `--markdown` > `--pretty` > console.

## Parsing JSON Output with jq

After `deadcode scan --json --output /tmp/deadcode.json <path>`:

```bash
# Overall summary
jq '.summary' /tmp/deadcode.json

# Count by kind
jq '[.findings | group_by(.kind)[] | {kind: .[0].kind, count: length}]' /tmp/deadcode.json

# High-confidence findings only (≥85%)
jq '[.findings[] | select(.confidence >= 0.85)]' /tmp/deadcode.json

# Multi-tool agreement (high-signal)
jq '[.findings[] | select(.tools | length > 1)]' /tmp/deadcode.json

# Top 10 findings by confidence, path:line format
jq -r '.findings | sort_by(-.confidence) | .[0:10] | .[] | "\(.file):\(.line)  \(.kind)  \(.confidence*100|floor)%  \(.symbol)"' /tmp/deadcode.json

# Findings in a specific file
jq '.findings[] | select(.file | endswith("foo.py"))' /tmp/deadcode.json

# Per-tool breakdown
jq '[.findings | group_by(.tool)[] | {tool: .[0].tool, count: length}]' /tmp/deadcode.json
```

When reporting findings to the user, cite them as `path:line` using `file` (absolute) so editors can jump directly, and include `kind`, `confidence`, and `symbol` for context.

## Ignore File (brief)

Drop a `.deadcode-ignore.toml` at the project root to suppress known false positives. `deadcode` discovers it by walking up from the scan root, like `.gitignore`.

```toml
# Ignore a specific finding by its stable ID (most precise)
[[ignore]]
id = "py:src/foo.py:42:unused_function:legacy_handler"
reason = "Called via reflection in worker dispatcher"

# Ignore by file glob + kind (kills whole buckets)
[[ignore]]
file = "src/models/**.py"
kinds = ["unused_field", "unused_variable"]
reason = "Pydantic/SQLAlchemy field declarations"

# Ignore by symbol pattern across the repo
[[ignore]]
symbol = "*_at"
languages = ["python"]
kinds = ["unused_variable"]
reason = "ORM timestamp columns"
```

All matchers on a rule AND together; rules are evaluated in order and the first match wins. `reason` is required. Symbol and file matchers support doublestar globs (`**`).

For full matcher semantics, glob rules, project-root resolution, and worked examples, see `references/ignore-file.md`.

## Per-Adapter Prerequisites — Common Errors

When an adapter reports `tools_unavailable` or fails mid-scan, the error message is actionable — relay it to the user verbatim. Common cases:

- **knip: "the project's node_modules are missing"** → run `npm install` (or `npm ci` / `pnpm install` / `yarn install`) in the project root, then re-scan.
- **elixir: "no _build/ directory"** → run `mix deps.get && mix compile` in the project root, then re-scan. First compile can take 30s–2min.
- **staticcheck / xdeadcode: "missing go.sum"** → run `go mod download` or `go mod tidy` in the module root, then re-scan.
- **staticcheck: no findings on a Go library** → known blindspot: staticcheck doesn't flag exported identifiers in non-main packages. The `xdeadcode` adapter runs alongside it specifically to close this gap via whole-program RTA. Both run by default.
- **elixir: dep warnings leaking into findings** → should not happen. The adapter scopes to the user's app via `mix.exs` `app: :name`. If dep warnings appear, check that `mix.exs` has a parseable `app:` declaration.

For full per-adapter notes (what each catches, what it misses, framework-specific defaults), see `references/adapters.md`.

## Guidelines

- **Always prefer `--json --output /tmp/<file>`** for agent workflows. Never parse pretty or markdown output programmatically.
- **Check `deadcode doctor` on first use** against a new project. Missing adapters silently skip — surfacing this to the user prevents "scan clean" false confidence.
- **Group by `tool` first** when polyglot. Multi-language projects benefit from per-language sections in user-facing reports.
- **Report `path:line` from `file`**, not from `id`. `file` is absolute and editor-clickable; `id` is for ignore-file matching, not display.
- **Flag high-confidence findings first** (`confidence >= 0.85`), especially multi-tool agreement (`len(tools) > 1`) — those are the deletable items users most want to see.
- **Surface `tools_unavailable`** prominently. The user needs to know if an adapter was skipped.
- **Do not silently delete code** based on findings. Always show the user the findings first and let them decide.
- **For CI usage**, use `--threshold 0 --exit-code 1 --json` to fail a build on any finding, with structured output for machine consumption.
- **For PR descriptions**, use `--markdown --output report.md` and paste the file contents into the PR body.

## Exit Codes

| Code | Meaning |
|---|---|
| 0 | Scan succeeded (findings may exist; see report) |
| 1 | Threshold exceeded (only when `--threshold` set and `--exit-code 1` supplied) |
| 2 | Scan error (ignore file invalid, adapter failure, bad flags) |

## Additional Resources

### Reference Files

For details beyond the SKILL.md body:

- **`references/finding-schema.md`** — Complete `Finding` shape, `IgnoredFinding`, `Report` envelope, `Evidence` key conventions, `fix_hint` semantics, and schema-version policy.
- **`references/ignore-file.md`** — Full `.deadcode-ignore.toml` matcher semantics, glob rules, project-root resolution, first-match-wins ordering, and worked examples from real Phoenix and React projects.
- **`references/adapters.md`** — Per-adapter quirks: what each tool catches, what it misses (e.g. staticcheck's internal-package blindspot, Elixir's unused-public-function gap), framework-specific default ignores, and install details beyond the quick table above.

### Companion Skills

`deadcode` does dead-code only. For **duplicated code**, use the `jscpd` skill — different tool (`jscpd`), different schema, complementary purpose. Run both in the same session when doing a full code-health audit.
