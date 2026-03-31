---
name: rodney
description: Browser automation using the rodney CLI for Chrome. Use when you need to interact with web pages, take screenshots at different viewports, fill forms, verify UI changes, scrape data, or test responsive layouts. Triggers on "browse website", "take screenshot", "verify UI", "check responsive", "fill form", "test page", "visual verification".
---

# rodney: Chrome Automation CLI

Headless Chrome automation via Bash. Uses **standard CSS selectors** — no discovery step needed. Faster and more token-efficient than ref-based alternatives.

## Setup Check

```bash
command -v rodney >/dev/null 2>&1 && echo "Installed" || echo "NOT INSTALLED"
```

## Architecture

Rodney launches a **persistent headless Chrome process** that survives CLI exits. Each `rodney` command is a short-lived process that connects to the running browser via WebSocket, executes, and disconnects. Connection details are stored in `~/.rodney/state.json` (global) or `./.rodney/state.json` (local).

This means:
- Chrome stays running between commands, between sessions, even between terminal restarts
- Tabs, cookies, and login state persist across CLI invocations
- You only pay the Chrome startup cost once

## Core Workflow

**First time or after reboot:** start Chrome once, then just use it.

```bash
# Check if Chrome is already running
rodney status                             # "Chrome running" or error

# Start only if needed
rodney start                              # Launch headless Chrome (persists!)

# Use it — CSS selectors directly, no discovery step
rodney open http://localhost:4000         # Navigate
rodney input 'input[name="email"]' "x"   # Interact by CSS selector
rodney screenshot /tmp/page.png           # Capture

# DON'T stop unless you're done for good — Chrome persists for reuse
```

## Command Reference

### Browser Lifecycle

```bash
rodney status                 # Check if Chrome is already running
rodney start                  # Headless Chrome (persists after CLI exits!)
rodney start --show           # Visible Chrome (debugging)
rodney start --insecure       # Ignore HTTPS cert errors (dev servers)
rodney connect host:9222      # Connect to existing Chrome on a remote debug port
rodney stop                   # Shut down Chrome and clean up state
```

**Always check `rodney status` first** — Chrome may already be running from a previous session. Only call `start` if it's not running. Only call `stop` when you're truly done — leaving Chrome running saves startup time for the next session.

### Navigation

```bash
rodney open <url>             # Navigate to URL
rodney back                   # Browser back
rodney forward                # Browser forward
rodney reload                 # Reload page
rodney reload --hard          # Hard reload (bypass cache)
rodney clear-cache            # Clear browser cache
```

### Reading Page Content

```bash
rodney url                    # Current URL
rodney title                  # Page title
rodney html                   # Full page HTML
rodney html 'selector'        # Element's HTML
rodney text 'selector'        # Element's text content
rodney attr 'selector' href   # Element attribute value
```

### Interaction

```bash
rodney click 'selector'               # Click element
rodney input 'selector' "text"        # Type into input (appends)
rodney clear 'selector'               # Clear input field
rodney select 'selector' "value"      # Select dropdown option by value
rodney submit 'selector'              # Submit a form
rodney hover 'selector'               # Hover over element
rodney focus 'selector'               # Focus element
rodney file 'selector' /path/to/file  # Set file input
```

### JavaScript Execution

**Powerful escape hatch** for anything CSS selectors can't do:

```bash
# Simple expression
rodney js 'document.title'

# IIFE for multi-statement logic (var/let/const require this)
rodney js '(() => { var el = document.querySelector("h1"); el.scrollIntoView(); return el.textContent; })()'

# Scroll a specific container (not just window)
rodney js '(() => { var main = document.querySelector("main"); main.scrollTop = 2000; return main.scrollTop; })()'

# Get computed style
rodney js 'getComputedStyle(document.querySelector(".grid")).gridTemplateColumns'
```

**Gotcha:** Bare `var`/`let`/`const` statements cause SyntaxError. Always wrap in an IIFE: `'(() => { var x = 1; return x; })()'`

### Waiting

```bash
rodney wait 'selector'        # Wait for element to appear in DOM
rodney waitload               # Wait for page load event
rodney waitstable             # Wait for DOM to stabilize
rodney waitidle               # Wait for network idle
rodney sleep 2                # Sleep N seconds (avoid when possible)
```

### Screenshots

```bash
rodney screenshot /tmp/page.png                  # Viewport screenshot
rodney screenshot -w 375 -h 812 /tmp/mobile.png  # Screenshot at specific viewport size
rodney screenshot-el 'selector' /tmp/el.png       # Screenshot a single element
rodney pdf /tmp/page.pdf                          # Save as PDF
```

**The `-w` and `-h` flags resize the viewport for the screenshot.** This is the correct way to test responsive breakpoints — take multiple screenshots at different widths in sequence.

### Element Checks

```bash
rodney exists 'selector'                  # Exit 0 if exists, 1 if not
rodney count 'selector'                   # Count matching elements
rodney visible 'selector'                 # Exit 0 if visible, 1 if not
rodney assert 'expr' expected -m "msg"    # Assert JS expression equals value
```

### Tabs

```bash
rodney pages                  # List all open tabs
rodney page 2                 # Switch to tab by index
rodney newpage http://url     # Open new tab
rodney closepage 2            # Close tab by index
```

### Accessibility Tree

```bash
rodney ax-tree                    # Full accessibility tree
rodney ax-tree --depth 3          # Limited depth
rodney ax-tree --json             # JSON output
rodney ax-find --role button      # Find nodes by role
rodney ax-find --name "Submit"    # Find nodes by name
rodney ax-node 'selector'        # A11y info for specific element
```

### Session Scoping

```bash
rodney start --local          # Directory-scoped session (./.rodney/)
rodney start --global         # Global session (~/.rodney/)
rodney --local status         # Force check local session
rodney --global open <url>    # Force use global session
```

**Auto-detection:** If `./.rodney/state.json` exists in the current directory, rodney uses the local session; otherwise it uses the global session at `~/.rodney/`.

**Persistent sessions:** Chrome runs independently of your terminal. After `rodney start`, the browser stays alive even if the terminal closes. Subsequent `rodney` commands reconnect via the WebSocket URL saved in `state.json`. Tabs, cookies, and login state all persist. Use `rodney stop` only when you genuinely want to kill Chrome.

## Recipes

### Login + Navigate

```bash
rodney start
rodney open http://localhost:4000/sign-in
rodney waitload
rodney input 'input[name="user[email]"]' "dev@example.com"
rodney input 'input[name="user[password]"]' "password123"
rodney click 'button[type="submit"]'
rodney waitload
rodney open http://localhost:4000/dashboard
rodney waitstable
rodney screenshot /tmp/dashboard.png
```

### Responsive Breakpoint Verification

Test a page at all Tailwind breakpoints in one session:

```bash
rodney start
# ... login and navigate ...

# Scroll to the section you want to verify
rodney js '(() => { var el = document.querySelector(".my-section"); el.scrollIntoView({block: "start"}); return "scrolled"; })()'

# Capture at each breakpoint
rodney screenshot -w 375  -h 812 /tmp/mobile.png   # Mobile: 1 col
rodney screenshot -w 768  -h 900 /tmp/md.png       # md: 2 col
rodney screenshot -w 1280 -h 900 /tmp/xl.png       # xl: 3 col
rodney screenshot -w 1536 -h 900 /tmp/2xl.png      # 2xl: 4 col

rodney stop
```

Then use the Read tool to view each screenshot.

### Scroll Inside Overflow Containers

The page `window.scrollTo` won't work when the scrollable element is a child container (common in sidebar layouts). Use JS to scroll the right element:

```bash
# Find and scroll the main content container
rodney js '(() => { var main = document.querySelector("main"); main.scrollTop = 2000; return main.scrollTop; })()'

# Scroll a specific element into view
rodney js 'document.querySelector(".target-section").scrollIntoView({block: "start"})'

# Scroll to an element found by text content
rodney js '(() => { var headings = document.querySelectorAll("h2"); for (var i = 0; i < headings.length; i++) { if (headings[i].textContent.trim() === "Assessments") { headings[i].scrollIntoView({block: "start"}); return "found"; } } return "not found"; })()'
```

### Verify Element Properties

```bash
# Check grid columns at current viewport
rodney js 'getComputedStyle(document.querySelector(".grid")).gridTemplateColumns'

# Count cards in a section
rodney count '.assessment-card-header'

# Check if element has expected class
rodney js 'document.querySelector(".my-element").classList.contains("bg-primary")'

# Get all text from a list of elements
rodney js '(() => { return Array.from(document.querySelectorAll("h3.truncate")).map(function(e) { return e.textContent.trim(); }); })()'
```

## Guidelines

- **Check `rodney status` first:** Chrome may already be running. Only `start` if needed, only `stop` when truly done
- **Use CSS selectors directly:** No need to discover refs first — this is rodney's key advantage
- **Prefer `waitload`/`waitstable` over `sleep`:** More reliable and faster
- **Use `-w`/`-h` for responsive testing:** Don't try to resize the viewport via JS
- **IIFE for JS:** Wrap multi-statement JS in `(() => { ... })()`
- **Use `js` for scrolling:** `rodney js` is the escape hatch for overflow containers, computed styles, and anything selectors can't express
- **Read screenshots with the Read tool:** Take screenshot to `/tmp/`, then `Read` the file to view it
- **Chain commands with `&&`:** For sequential operations in one Bash call

## Companion Tool: showboat

rodney pairs naturally with the **showboat** CLI (`~/.claude/skills/showboat/SKILL.md`) for creating reproducible demo documents. Use rodney for browser interaction and screenshots, then showboat to embed them in a verifiable walkthrough:

```bash
showboat exec demo.md bash "rodney screenshot -w 375 -h 812 /tmp/mobile.png"
showboat image demo.md '![Mobile layout](/tmp/mobile.png)'
```

See the showboat skill for full details on building proof-of-work documents.

## Exit Codes

| Code | Meaning |
|------|---------|
| 0 | Success |
| 1 | Check failed (exists, visible, assert returned false) |
| 2 | Error (bad arguments, no browser, timeout) |
