---
name: prompt-fable-5
description: >-
  Prompting patterns for Claude Fable 5: long-horizon autonomy, act-when-ready,
  checkpoints, boundaries, parallel subagents, autonomous pipelines, memory/lessons
  files, readability after long runs, send_to_user tool, and scaffolding audit.
  Use when tuning prompts for Fable 5, multiday agent runs, async agents, or when
  Fable overplans, asks mid-task permission, or produces unreadable summaries.
---

# Prompting Claude Fable 5

Read [shared/prompt-fable.md](../../../shared/prompt-fable.md). Scope, evidence, and search rules live in [shared/policy.md](../../../shared/policy.md).

## Quick apply

| Situation | Use block in prompt-fable.md |
|---|---|
| Re-planning instead of acting | Act when ready |
| Unrequested refactors at high effort | Scope / no overengineering |
| Ending on "I'll…" without tools | Autonomous pipelines |
| False progress on long runs | Progress claims (also in policy) |
| User asked a question, got a patch | Boundaries / assessment vs fix |
| Parallel work (user opted in) | Parallel subagents |
| Overnight / many tool calls | Readability summary |
| Repeated long projects | Memory / lessons + `templates/LESSONS.md.snippet` |
| Async UX needs verbatim mid-run messages | send_to_user tool + elicitation |
| Premature "new session" suggestions | Context budget reassurance |
| Legacy skills hurt quality | Scaffolding audit section |

## Harness interaction

- Respect agent budget unless the user opted into parallel agents.
- Do not spawn verify subagents for routine work; Fable's verifier-subagent pattern is for explicit multiday runs the user scoped.
- Do not instruct reasoning echo in responses — use API thinking blocks instead.

## Reference

Official guide: [Prompting Claude Fable 5](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-fable-5)
