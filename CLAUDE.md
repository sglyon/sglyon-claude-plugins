# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

This is a Claude Code **plugin marketplace** repository. It hosts the `sgldev` plugin under `plugins/sgldev/`, which provides specialized code review agents and skills.

## Repository Structure

- `.claude-plugin/marketplace.json` — Marketplace manifest (lists available plugins, used by `/plugin marketplace add`)
- `plugins/sgldev/.claude-plugin/plugin.json` — Plugin manifest (name, version, description)
- `plugins/sgldev/agents/` — Agent definitions (Markdown files with YAML frontmatter)
- `plugins/sgldev/skills/` — Skills (each in its own directory with a `SKILL.md`)

## Development Notes

- When bumping the plugin version, update `plugins/sgldev/.claude-plugin/plugin.json` (the `marketplace.json` version is separate and tracks the marketplace itself)
- Skills use a `SKILL.md` file with YAML frontmatter for metadata and Markdown body for the skill prompt
- Agents are single `.md` files with YAML frontmatter defining `subagent_type`, tools, model, and behavioral description

## History

A previous design (v1.x) included a per-agent expertise system: hooks (SessionStart, SubagentStart, PostToolUse) injected lifecycle instructions and validated `.expertise/models/<agent>.md` files where agents accumulated repo-specific knowledge across sessions. The system was removed in v2.0.0 — it added complexity without delivering enough value to justify it.
