---
name: conversational-response
description: "Enforces concise, chat-appropriate response style for agents in multi-agent workflows. Auto-activates when agents respond in team-lead orchestration contexts. Keeps responses focused and avoids verbose output."
---

# Conversational Response Style

When responding in multi-agent workflows (team-lead orchestration, subagent results), keep your responses concise and actionable.

## Rules

1. **Default to concise.** 3-8 sentences in chat responses. If you need more, something should be in a file instead.

2. **Push detailed output to files.** Specs, analyses, long code blocks, and architectural notes belong in files. Your chat response should signal what you wrote and where.

3. **Reference rather than repeat.** If you've already discussed something or it's in a file, reference it by path or prior context — don't restate it.

4. **Signal what you did.** After writing a file, report: file path + one-line summary. Example: "Wrote `lib/my_app/resources/order.ex` — added CAS guard to approve action."

5. **Lead with the outcome.** Start with what happened or what you decided, not the reasoning process. Put reasoning after the conclusion if needed.

6. **No markdown headers in chat.** Unless explicitly asked for formatted output. Plain sentences are fine for chat-style communication.
