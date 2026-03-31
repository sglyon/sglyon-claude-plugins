---
name: showboat
description: Create executable demo documents that prove an agent's work. Use when you need to document a workflow, create a reproducible walkthrough, capture screenshots with context, build a demo of changes, or produce verifiable proof-of-work artifacts. Triggers on "create demo", "document workflow", "show your work", "prove it works", "walkthrough", "demo document", "reproducible proof".
---

# showboat: Executable Demo Documents

Build markdown documents that mix commentary, executable code blocks, and captured output. Documents serve as both **readable documentation** and **reproducible proof of work** — a verifier can re-execute all code blocks and confirm outputs still match.

## Setup Check

```bash
command -v showboat >/dev/null 2>&1 && echo "Installed" || echo "NOT INSTALLED - run: pip install showboat"
```

## When to Use showboat

Use showboat when you need to **prove your work** or **document a procedure**:

- After implementing a feature, demonstrate it works
- Create a reproducible walkthrough of a setup process
- Capture browser screenshots with surrounding context and commands
- Build verifiable proof that tests pass, servers start, or configs are correct
- Document a debugging session with actual command output

## Core Workflow

```bash
# 1. Initialize a document
showboat init demo.md "Feature: Responsive Grid Layout"

# 2. Add commentary explaining what you're doing
showboat note demo.md "First, verify all tests pass."

# 3. Run commands — output is captured AND printed to stdout
showboat exec demo.md bash "mix test --max-failures 3"

# 4. Add more context
showboat note demo.md "Now let's verify the grid renders correctly at mobile width."

# 5. Include screenshots (image is copied alongside the document)
showboat exec demo.md bash "rodney screenshot -w 375 -h 812 /tmp/mobile.png"
showboat image demo.md '![Mobile grid layout](/tmp/mobile.png)'

# 6. Verify the document is reproducible
showboat verify demo.md
```

## Command Reference

### Document Lifecycle

```bash
showboat init <file> <title>                  # Create new document with title + timestamp
showboat verify <file>                        # Re-run all code blocks, diff against recorded output
showboat verify <file> --output <new>         # Write updated copy without modifying original
showboat extract <file>                       # Emit CLI commands that recreate the document
showboat extract <file> --filename <name>     # Substitute different filename in emitted commands
```

### Adding Content

```bash
showboat note <file> "Commentary text"        # Append a markdown paragraph
showboat note <file>                          # Read note from stdin (pipe-friendly)
showboat exec <file> <lang> "code"            # Run code, capture output, append both
showboat exec <file> <lang>                   # Read code from stdin
showboat image <file> /path/to/image.png      # Copy image into doc directory, append reference
showboat image <file> '![alt text](path)'     # Copy image with custom alt text
showboat pop <file>                           # Remove most recent entry (undo last action)
```

### Global Options

```bash
showboat --workdir <dir> <command>            # Set working directory for code execution
showboat --version                            # Print version
showboat --help                               # Show help
```

## exec Behavior

The `exec` command is the workhorse:

- **Prints output to stdout** so you can see what happened and react to errors
- **Appends both code and output** to the document regardless of exit code
- **Preserves the exit code** of the executed command
- Use `pop` to remove a failed entry you don't want to keep

```bash
# Exit code passes through — react to failures
showboat exec demo.md bash "mix test" || showboat note demo.md "Tests failed, investigating..."

# Supported languages: bash, python, python3, elixir, etc.
showboat exec demo.md python3 "print('Hello')"
showboat exec demo.md elixir "IO.puts(:hello)"
```

## Stdin Support

All content commands accept piped input when the text argument is omitted:

```bash
echo "This note comes from a pipe" | showboat note demo.md
cat script.sh | showboat exec demo.md bash
```

## Resulting Markdown Format

showboat produces clean, readable markdown:

```markdown
# My Demo Title

*2026-02-26T15:30:00Z*

First, let's check the setup.

` ` `bash
echo "hello world"
` ` `

` ` `output
hello world
` ` `

![Screenshot](screenshot-abc123.png)
```

## Companion Tool: rodney

showboat pairs naturally with the **rodney** CLI (`~/.claude/skills/rodney/SKILL.md`) for browser automation demos. rodney handles Chrome interaction (navigation, screenshots, form filling), while showboat captures the entire session as a reproducible document.

### Combined Workflow

```bash
showboat init demo.md "Visual Verification: Skills Grid"

showboat note demo.md "Ensure rodney's Chrome is running."
showboat exec demo.md bash "rodney status || rodney start"

showboat note demo.md "Navigate to the Skills page and wait for load."
showboat exec demo.md bash "rodney open http://localhost:4000/skills && rodney waitstable"

showboat note demo.md "Capture the assessment grid at mobile breakpoint."
showboat exec demo.md bash "rodney screenshot -w 375 -h 812 /tmp/mobile.png"
showboat image demo.md '![Mobile: 1-column grid](/tmp/mobile.png)'

showboat note demo.md "Capture at desktop breakpoint."
showboat exec demo.md bash "rodney screenshot -w 1280 -h 900 /tmp/desktop.png"
showboat image demo.md '![Desktop: 3-column grid](/tmp/desktop.png)'

showboat note demo.md "Verify the document is reproducible."
showboat verify demo.md
```

### When to Use Which

| Need | Tool |
|------|------|
| Interact with a browser | **rodney** |
| Capture screenshots | **rodney** (take) + **showboat** (embed in doc) |
| Run shell/code commands and capture output | **showboat** |
| Create a readable, verifiable walkthrough | **showboat** |
| Prove responsive breakpoints work | **rodney** + **showboat** together |

## Recipes

### Post-Implementation Proof of Work

After completing a feature, build a demo document that proves it works:

```bash
showboat init /tmp/proof.md "Proof: Assessment Grid Feature"

showboat note /tmp/proof.md "All tests pass."
showboat exec /tmp/proof.md bash "cd /Volumes/work/src/arete/arilearn-phx && mix test test/arilearn_web/live/skills_live_test.exs"

showboat note /tmp/proof.md "Precommit checks pass."
showboat exec /tmp/proof.md bash "cd /Volumes/work/src/arete/arilearn-phx && mix precommit"

showboat note /tmp/proof.md "Visual verification at all breakpoints."
showboat exec /tmp/proof.md bash "rodney status || rodney start"
showboat exec /tmp/proof.md bash "rodney open http://localhost:4000/skills && rodney waitstable"

for bp in "375 812 mobile" "768 900 tablet" "1280 900 desktop" "1536 900 wide"; do
  set -- $bp
  showboat exec /tmp/proof.md bash "rodney screenshot -w $1 -h $2 /tmp/$3.png"
  showboat image /tmp/proof.md "![$3 breakpoint](/tmp/$3.png)"
done

showboat verify /tmp/proof.md
```

### Debugging Session Log

Capture a debugging session as a reproducible artifact:

```bash
showboat init /tmp/debug.md "Debug: Slow Query on Skills Page"

showboat note /tmp/debug.md "Reproduce the issue — check server logs."
showboat exec /tmp/debug.md bash "curl -s -o /dev/null -w '%{time_total}' http://localhost:4000/skills"

showboat note /tmp/debug.md "Check for N+1 queries in the log output."
showboat exec /tmp/debug.md bash "tail -20 /tmp/phoenix.log | grep -c 'SELECT'"

showboat note /tmp/debug.md "After fix, verify latency improved."
showboat exec /tmp/debug.md bash "curl -s -o /dev/null -w '%{time_total}' http://localhost:4000/skills"
```

### Remote Streaming

Set `SHOWBOAT_REMOTE_URL` to POST document updates in real-time to an external viewer:

```bash
export SHOWBOAT_REMOTE_URL=https://example.com/showboat?token=secret
showboat init demo.md "Live Demo"
# All subsequent commands POST updates to the remote URL
```

## Guidelines

- **Use `exec` for anything you want captured** — don't run bare Bash commands if the output should be in the document
- **Use `note` liberally** — commentary makes the document readable, not just a wall of code blocks
- **Use `pop` to fix mistakes** — remove failed entries rather than leaving error output in the document
- **Use `verify` before sharing** — confirms all outputs are still reproducible
- **Use `image` for screenshots** — showboat copies the image alongside the doc for portability
- **Pair with rodney for browser work** — rodney captures screenshots, showboat embeds them with context
- **Keep documents focused** — one demo per feature or workflow, not a monolithic dump

## Exit Codes

| Code | Meaning |
|------|---------|
| 0 | Success (or verify: all outputs match) |
| 1 | Verify: output mismatch detected |
| N | exec: passes through the executed command's exit code |
