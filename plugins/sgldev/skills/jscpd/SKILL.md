---
name: jscpd
description: Detect duplicated code across 150+ languages using the jscpd CLI. Use when asked to find copy/paste duplication, detect clones, measure code duplication, audit a repo for repeated blocks, or check duplication thresholds in CI. Triggers on "find duplicate code", "detect clones", "jscpd", "copy paste detector", "duplication report", "duplicated blocks".
---

# jscpd: Multi-Language Copy/Paste Detector

Token-based duplication detection across 150+ languages (JS/TS, Python, Go, Rust, Ruby, Java, C/C++, C#, PHP, Swift, Kotlin, Scala, Elixir, Dart, Markdown, SQL, ...). Fast, zero-config by default, structured JSON output — ideal for agent workflows.

## Setup Check

```bash
command -v jscpd >/dev/null 2>&1 && jscpd --version || echo "use: npx jscpd"
```

No install required — `npx jscpd ...` works everywhere Node is available. For repeated use on the same machine, `npm i -g jscpd` is faster.

## Core Workflow

**Default agent-friendly invocation:** silent run, JSON report to a temp dir, then read the JSON.

```bash
# Scan a path, emit JSON only, no console chatter
npx jscpd --silent --reporters json --output /tmp/jscpd/ /path/to/repo

# Result lives here:
cat /tmp/jscpd/jscpd-report.json
```

Then use the `Read` tool on `/tmp/jscpd/jscpd-report.json` and work with the structured output.

## Command Reference

### Basic invocation

```bash
jscpd <path>                           # Scan a path (console report)
jscpd .                                # Scan current directory
jscpd src/ lib/                        # Scan multiple paths
npx jscpd <path>                       # No-install variant
```

### Output control

```bash
-r, --reporters <list>    # console,consoleFull,json,xml,csv,markdown,html,sarif,verbose
-o, --output <dir>        # Output directory for file reports (default ./report/)
-s, --silent              # Suppress console noise (pair with --reporters json)
-a, --absolute            # Use absolute paths in reports (easier for agents to jump to files)
```

Common agent pattern:

```bash
jscpd --silent --reporters json --absolute --output /tmp/jscpd/ <path>
```

### Detection sensitivity

```bash
-k, --min-tokens <n>      # Min block size in tokens (default 50) — raise to reduce noise
-l, --min-lines <n>       # Min block size in lines  (default 5)
-m, --mode <mode>         # strict | mild (default) | weak — higher tolerates more noise
    --ignore-pattern <rx> # Skip code blocks matching a regex
```

**Tuning guide:**
- **Too much noise?** `--min-tokens 70 --min-lines 8`
- **Missing real dupes?** `--min-tokens 30 --min-lines 3`
- **Strict mode** (`-m strict`) catches near-identical blocks only; **weak** ignores comments and whitespace and finds more.

### Filtering files and languages

```bash
-f, --format <list>       # Comma-separated formats: javascript,typescript,python,go,...
    --files <glob>        # Glob of files to include: "**/*.{ts,tsx}"
    --ignore <glob>       # Glob of files to exclude: "**/node_modules/**,**/dist/**"
```

`--format` accepts language names (see full list with `jscpd --help` or the docs). `--files`/`--ignore` accept standard glob patterns.

### Threshold / CI behavior

```bash
-t, --threshold <pct>     # Fail if duplication % exceeds this (e.g., 5)
    --exitCode <n>        # Exit code to use when duplications are found (default 0)
```

For CI gating: `jscpd --threshold 5 --exitCode 1 src/`

### Cross-folder dedupe only

```bash
    --skipLocal           # Only report duplicates that span different provided paths
```

Pass multiple paths and use `--skipLocal` to find code shared across modules/packages (ignoring duplication within a single path).

### Git blame

```bash
-b, --blame               # Annotate each clone with author + date from git
```

### Config file

Place `.jscpd.json` at repo root for persistent settings:

```json
{
  "threshold": 5,
  "reporters": ["json", "html"],
  "output": "./report/",
  "ignore": ["**/node_modules/**", "**/dist/**", "**/*.min.js"],
  "minTokens": 60,
  "minLines": 6,
  "absolute": true
}
```

Then just run `jscpd .`.

## JSON Report Structure

The key file is `<output>/jscpd-report.json`. Top-level shape:

```json
{
  "duplicates": [
    {
      "format": "typescript",
      "lines": 27,
      "tokens": 120,
      "fragment": "...source code of the clone...",
      "firstFile": {
        "name": "/abs/path/to/a.ts",
        "start": 10, "end": 36,
        "startLoc": {"line": 10, "column": 1},
        "endLoc":   {"line": 36, "column": 2}
      },
      "secondFile": {
        "name": "/abs/path/to/b.ts",
        "start": 42, "end": 68,
        "startLoc": {"line": 42, "column": 1},
        "endLoc":   {"line": 68, "column": 2}
      }
    }
  ],
  "statistic": {
    "total": {
      "lines": 12034,
      "sources": 180,
      "clones": 14,
      "duplicatedLines": 312,
      "percentage": 2.59
    },
    "formats": {
      "typescript": { "total": { "...": "..." }, "sources": { "...": "..." } }
    }
  }
}
```

Each entry in `duplicates` is a pair. `firstFile`/`secondFile` give you exact line ranges to jump to with `Read`. `statistic.total.percentage` is the overall dup rate.

## Recipes

### Quick repo audit (agent default)

```bash
rm -rf /tmp/jscpd && \
npx jscpd --silent --reporters json --absolute \
  --ignore "**/node_modules/**,**/dist/**,**/build/**,**/.venv/**,**/vendor/**" \
  --output /tmp/jscpd/ .
```

Then `Read /tmp/jscpd/jscpd-report.json` and summarize the top duplicates by `lines * tokens`.

### Language-scoped scan

```bash
# Only TypeScript/TSX
npx jscpd --silent --reporters json --absolute \
  --format typescript,tsx \
  --output /tmp/jscpd/ src/

# Or by glob instead
npx jscpd --silent --reporters json --absolute \
  --files "src/**/*.{ts,tsx}" \
  --output /tmp/jscpd/ .
```

### Cross-package duplication only

Find code shared across two packages (ignore dupes inside each):

```bash
npx jscpd --silent --reporters json --absolute --skipLocal \
  --output /tmp/jscpd/ packages/web packages/api
```

### Raise the bar (big clones only)

```bash
npx jscpd --silent --reporters json --absolute \
  --min-tokens 100 --min-lines 15 \
  --output /tmp/jscpd/ .
```

### CI gate

```bash
jscpd --threshold 5 --exitCode 1 \
  --reporters console,json --output ./report/ src/
```

Exit code is non-zero if duplication > 5%.

### Human-readable report + JSON

```bash
jscpd --reporters html,json,console --output ./report/ src/
# Open ./report/html/index.html in a browser for a rich UI
```

### Blame-annotated triage

```bash
jscpd --blame --reporters json --silent --output /tmp/jscpd/ src/
# Each clone now includes git author/date — useful for attribution and triage
```

## Parsing the JSON From an Agent

After running with `--reporters json`, inspect the report programmatically:

```bash
# Overall duplication percentage
jq '.statistic.total.percentage' /tmp/jscpd/jscpd-report.json

# Count of clone pairs
jq '.duplicates | length' /tmp/jscpd/jscpd-report.json

# Top 10 clones by line count
jq '[.duplicates[] | {lines, a: .firstFile.name, al: .firstFile.startLoc.line,
                      b: .secondFile.name, bl: .secondFile.startLoc.line}]
    | sort_by(-.lines) | .[0:10]' /tmp/jscpd/jscpd-report.json

# Per-language summary
jq '.statistic.formats | to_entries | map({lang: .key, pct: .value.total.percentage, clones: .value.total.clones})' \
  /tmp/jscpd/jscpd-report.json
```

When reporting findings to the user, cite locations as `path:line` using `firstFile.name:firstFile.startLoc.line` so they're clickable.

## Guidelines

- **Always pair `--silent` with `--reporters json`** for agent use — otherwise console output bloats your context.
- **Use `--absolute`** so file paths in the report are directly usable with the `Read` tool.
- **Write reports to `/tmp/jscpd/`**, not the repo — avoids polluting the working tree.
- **Always set `--ignore`** for `node_modules`, `dist`, `build`, `vendor`, `.venv`, lockfiles — the defaults don't know your stack.
- **Start with defaults**, then raise `--min-tokens` / `--min-lines` if the report is too noisy, or lower them if you know dupes exist but aren't being caught.
- **Use `--format`** when you only care about one language — much faster on polyglot repos.
- **Use `--skipLocal` with multiple paths** to find duplication *across* packages, not within them.
- **`--threshold` + `--exitCode`** is the correct CI pattern; don't grep console output.
- **Report to the user by `path:line`** pulled from `firstFile`/`secondFile` in the JSON.

## Exit Codes

| Code | Meaning |
|------|---------|
| 0    | Success (or dupes found but `--exitCode` not configured) |
| 1    | Duplication % exceeded `--threshold` (when `--exitCode 1` set) |
| >1   | CLI error (bad args, unreadable path, etc.) |
