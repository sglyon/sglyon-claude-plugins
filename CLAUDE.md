# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

This is a Claude Code **plugin marketplace** repository. It hosts the `sgldev` plugin under `plugins/sgldev/`, which provides specialized code review agents, skills, and a persistent agent expertise system powered by hooks.

## Repository Structure

- `.claude-plugin/marketplace.json` — Marketplace manifest (lists available plugins, used by `/plugin marketplace add`)
- `plugins/sgldev/.claude-plugin/plugin.json` — Plugin manifest (name, version, description)
- `plugins/sgldev/agents/` — Agent definitions (Markdown files with YAML frontmatter)
- `plugins/sgldev/skills/` — Skills (each in its own directory with a `SKILL.md`)
- `plugins/sgldev/hooks/hooks.json` — Hook definitions for all 6 lifecycle hooks
- `plugins/sgldev/hooks/scripts/` — Python scripts invoked by hooks (use PEP 723 inline metadata, run via `uv run`)
- `plugins/sgldev/scripts/` — Setup scripts (e.g., `init-expertise.sh`)
- `plugins/sgldev/specs/` — Design specs (e.g., agent expertise system spec)

## Key Concepts

### Agent Expertise System

The central architectural feature. Agents maintain persistent mental model files (`.expertise/models/<agent>.yaml`) in consuming projects. The system works via hooks:

1. **SessionStart / SubagentStart** — `inject_expertise.py` / `load_expertise.py` inject expertise lifecycle instructions into agents
2. **SubagentStop** — Prompt hook blocks subagents from stopping until they update their mental model
3. **PostToolUse (Write|Edit)** — `validate_expertise.py` validates YAML syntax and line limits on model files
4. **PreCompact** — `preserve_expertise.py` preserves expertise awareness across context compaction
All hook scripts share a common library: `hooks/scripts/expertise.py`.

### Hook Scripts

Hook scripts are Python, executed via `uvrun.sh` which wraps `uv run`. Dependencies are declared inline per PEP 723. **Requires `uv` to be installed.**

## Development Notes

- When bumping the plugin version, update `plugins/sgldev/.claude-plugin/plugin.json` (the `marketplace.json` version is separate and tracks the marketplace itself)
- Skills use a `SKILL.md` file with YAML frontmatter for metadata and Markdown body for the skill prompt
- Agents are single `.md` files with YAML frontmatter defining `subagent_type`, tools, model, and behavioral description
- Hook scripts output JSON to stdout — the hook system parses this output to determine actions (e.g., `additionalContext` injection, validation pass/fail)
