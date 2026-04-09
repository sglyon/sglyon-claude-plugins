# deadcode Adapter Reference

Per-adapter details: what each tool catches, what it misses, known limitations, and install specifics beyond the quick table in SKILL.md. Read this when debugging why a specific adapter isn't producing expected findings, or when deciding what additional tooling to layer on.

## vulture (Python)

**Tool:** <https://github.com/jendrikseipp/vulture>
**Install:** `pip install vulture` or `uv tool install vulture`
**Languages:** `python`

### What it catches

- Unused functions, methods, classes (private and public)
- Unused variables and class attributes
- Unused imports
- Unreachable code after `return` / `raise`
- Unused function arguments (with lower confidence)

### Confidence signal

Vulture emits a native percentage (60%–100%) with each finding. deadcode divides by 100. Typical tiers:

- **90–100%**: unused imports, unreachable code — high precision
- **60–80%**: unused functions, classes, variables — medium precision, may include framework-callable handlers

### Known false-positive patterns

**Framework-callable handlers** — FastAPI routes, Flask routes, Django views, pytest fixtures, Click commands, Celery tasks, etc. Vulture has an `--ignore-decorators` flag that deadcode wires up with a built-in default list covering these patterns. Override via:

```bash
deadcode scan --ignore-decorators "@my.custom,@app.special"
deadcode scan --no-default-decorators  # disable the built-in list
```

**ORM/schema fields** — Pydantic fields, SQLAlchemy columns, dataclass fields. Use the unified `.deadcode-ignore.toml` to suppress these (see ignore-file reference for the worked example).

**Module-level dynamic exports** — constants exported via `__all__` or accessed via `getattr()` look unused to vulture's AST walk. Ignore via file glob.

### Known true-positive strengths

- Catches unused **public** functions across modules (unlike staticcheck for Go or built-in Elixir tools). This is vulture's biggest advantage over per-language alternatives.
- Fast: typically sub-second on projects under 100 files.
- Zero project config required.

## knip (JavaScript/TypeScript)

**Tool:** <https://github.com/webpro-nl/knip>
**Install:** `npm install -g knip`. deadcode auto-falls back to `npx --yes knip` when Node is present but knip isn't installed globally.
**Languages:** `javascript`, `typescript`

### What it catches

- Unused files (whole files with no consumers) → `unused_file`
- Unused exports and types → `unused_export`
- Unused enum members → `unused_export` (symbol format: `MyEnum.OBSOLETE`)
- Unused class members → `unused_field` (symbol format: `MyClass.deadMethod`)
- Unused npm dependencies (`dependencies`, `devDependencies`, `binaries`) → `unused_dependency`

### Project awareness

knip is project-aware: it walks from `package.json`, honors `tsconfig.json`, and uses declared entry points. deadcode discovers the nearest `package.json` walking up from the scan path and runs knip in that directory. Monorepo support follows knip's own workspace detection.

### Requirements

knip dynamically loads the project's config files (e.g. `vite.config.ts`) which import their own dependencies. **The project's `node_modules/` must be installed** before scanning. When missing, the adapter emits a friendly error:

```
knip failed in /path (exit 2): the project's node_modules are missing
or incomplete. Run `npm install` (or `npm ci` / `pnpm install` /
`yarn install`) in /path and re-scan.
```

Surface this verbatim to the user.

### Skipped knip categories

knip reports several categories that are NOT dead code and that deadcode intentionally drops:

- `unlisted` — packages used but not in `package.json` (dependency hygiene, not dead code)
- `unresolved` — imports that can't resolve (build config issues, not dead code)
- `duplicates` — duplicate exports (bad practice, not dead)
- `catalog`, `namespaceMembers`, `optionalPeerDependencies` — pnpm/workspace-specific metadata

### shadcn/ui false-positive pattern

shadcn projects copy the full component library into `src/components/ui/` but only import a subset. knip flags the unused primitives AND cascades to their `@radix-ui/*` peer deps. See `references/ignore-file.md` for the worked example that kills this entire class.

## elixir (mix compile)

**Tool:** Elixir compiler itself, via `mix compile`
**Install:** Elixir ≥ 1.18 (`brew install elixir` or <https://elixir-lang.org/install.html>)
**Languages:** `elixir`

### What it catches

As of Elixir 1.18+, the compiler's set-theoretic type system reports dead code directly. `mix xref unreachable` was deprecated in 1.19 with the message "The unreachable check has been moved to the compiler and has no effect now." So **all** dead-code signal comes from `mix compile`.

Detected:

- Unused **private** functions within a module → `unused_function`
- Unreachable function clauses (type system finding) → `unreachable`
- Patterns that can never match → `unreachable`
- Branches in `try`/`cond`/`case` that can never hit → `unreachable`
- Unused aliases and imports → `unused_import`
- Unused variables → `unused_variable`

### Known limitation: unused public functions

The built-in compiler does NOT catch unused **public** functions across modules. This is the famous "`mix xref unreachable` only reported private functions" gap that persisted into the compiler's type checker.

For full coverage, users can add `mix_unused` as a dev dependency in their project:

```elixir
# mix.exs
defp deps do
  [{:mix_unused, "~> 0.4", only: :dev, runtime: false}]
end
```

`mix_unused` is a compile tracer, so its warnings flow through `mix compile` and the deadcode Elixir adapter picks them up automatically. No adapter changes needed. When present, watch for `unused_function` findings on public module functions.

### Requirements

Elixir compilation requires `_build/` to exist. When missing, the adapter emits:

```
mix project at /path has no _build/ directory. Run
`mix deps.get && mix compile` in /path and re-scan
(first compile may take a minute).
```

First compile on a large Phoenix app can take 30s–2min. Incremental runs are much faster (~5s). This is the slowest adapter.

### Built-in Phoenix/OTP ignore list

The Elixir adapter has a hardcoded default ignore list for framework-callable patterns that the compiler will never see callers for:

- Phoenix controller actions: `*Controller.index/2`, `show/2`, `new/2`, `create/2`, `edit/2`, `update/2`, `delete/2`, `call/2`
- GenServer / OTP callbacks: `handle_call/3`, `handle_cast/2`, `handle_info/2`, `handle_continue/2`, `init/1`, `terminate/2`, `code_change/3`, `format_status/*`
- LiveView callbacks: `mount/3`, `handle_event/3`, `handle_params/3`, `handle_async/3`, `render/1`, `update/2`
- Phoenix Channels: `join/3`, `handle_in/3`, `handle_out/3`
- Plug: `call/2`, `init/1`
- Ecto: `changeset/2`, `changeset/1`

This filter is **dormant** in v0.7 because built-in tools don't catch unused public functions yet — it's pre-installed for when `mix_unused` integration lights it up.

### Section filtering

`mix compile --force` recompiles dependencies too, and deps emit their own warnings. The adapter scopes to the user's own app section by reading `app: :name` from `mix.exs` and only keeping warnings from the `==> <app_name>` section of mix output. Umbrella projects (`apps_path:` in root `mix.exs`) fall back to keep-all-sections — full umbrella support is a future improvement.

## staticcheck (Go)

**Tool:** <https://staticcheck.dev>
**Install:** `go install honnef.co/go/tools/cmd/staticcheck@latest`
**Languages:** `go`

### What it catches

Runs with `-checks=U1000 -f json` to catch:

- Unused functions → `unused_function`
- Unused methods → `unused_method`
- Unused types → `unused_type`
- Unused constants → `unused_constant`
- Unused variables → `unused_variable`
- Unused struct fields → `unused_field`

### Known blindspot

**staticcheck does NOT flag exported identifiers in non-main packages**, even under `internal/`. Its reasoning is that external consumers might use them; the reality is that `internal/` packages can only be used by the containing module. This blindspot matters for Go library projects.

The `xdeadcode` adapter (below) runs alongside staticcheck specifically to close this gap.

### Requirements

Requires `go.sum` to be present and dependencies downloaded. When missing:

```
staticcheck failed in /path (exit N): the module's dependencies are
missing or stale. Run `go mod download` (or `go mod tidy`) in /path
and re-scan.
```

## xdeadcode (Go, second source)

**Tool:** <https://pkg.go.dev/golang.org/x/tools/cmd/deadcode>
**Install:** `go install golang.org/x/tools/cmd/deadcode@latest`
**Languages:** `go`

This is the official Go team's dead-code tool. It performs whole-program Rapid Type Analysis (RTA) from `main` functions to build a call graph, then reports any function not reachable from main.

### What it catches

- Unreachable **functions** (including exported ones in non-main packages — the gap staticcheck leaves)
- Unreachable **methods**
- Skips generated files and marker interface methods by default

### Scope

**Only reports functions/methods.** Types, constants, variables, and fields are outside its remit — that's what staticcheck covers. Run both adapters together for full coverage.

### Requirements

Requires at least one `main` package in the module. Pure library modules produce `exit 1 + "no main packages"` which the adapter treats as a clean no-op (not an error).

### Cross-tool dedupe

When both staticcheck and xdeadcode flag the same Go function, the runner's cross-tool dedupe merges them into one finding with `tools: ["staticcheck", "xdeadcode"]`. The merged symbol is the longer/more-qualified form (usually the `package.Name` variant from xdeadcode).

Check for multi-tool agreement with:

```bash
jq '[.findings[] | select(.tools | length > 1)]' /tmp/deadcode.json
```

Multi-tool agreement is the highest-confidence signal — two independent analyzers confirming the same dead code.

## Runner-level behavior

All adapters run in **parallel** via an errgroup. A single adapter's failure populates `summary.tools_unavailable` but doesn't fail the scan. Other adapters still complete. The summary surfaces:

- `tools_run[]` — what actually executed successfully
- `tools_unavailable[]` — human-readable reason each skipped adapter was skipped

Always surface `tools_unavailable` to the user — silent gaps in coverage are worse than false confidence.

## Skipped directories (hardcoded)

The language detection walker skips these directory names anywhere in the tree:

```
.git, node_modules, dist, build, .next, .nuxt, .turbo,
.venv, venv, __pycache__, vendor, .tox, _build, deps,
.elixir_ls, testdata
```

This prevents counting hex packages (Elixir `deps/`), npm packages (`node_modules/`), Go vendored code, Python virtualenvs, and Go test fixtures as part of `files_scanned`.
