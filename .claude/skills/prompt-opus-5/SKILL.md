---
name: prompt-opus-5
description: >-
  Prompting patterns for Claude Opus 5: effort levels, response verbosity,
  agentic narration cadence, written deliverable length, task scope, subagent
  delegation limits, self-correction narration, and thinking-disabled pitfalls.
  Use when tuning prompts, rules, skills, or CLAUDE.md for Opus 5, or when Opus
  output is too verbose, over-verifies, spawns too many subagents, or narrates
  minor fixes.
---

# Prompting Claude Opus 5

Read [shared/prompt-opus.md](../../../shared/prompt-opus.md). Scope and search rules live in [shared/policy.md](../../../shared/policy.md).

## Quick apply

| Symptom | Add / remove |
|---|---|
| Slow / expensive on routine work | Lower host effort to `medium` / `low` (see Effort in prompt-opus.md) |
| Hard agentic coding needs more depth | Raise host effort to `xhigh` (keep thinking on) |
| Responses too long | Brevity block in prompt-opus.md (effort ≠ length) |
| Too much status narration | Progress-update cadence block |
| Bloated reports/docs | Written-deliverable length block |
| Extra verification passes | **Remove** verify / double-check instructions |
| Subagent sprawl | Harness caps agents; add delegation block only when user opts in |
| Noisy "I was wrong earlier" | Self-correction narration block |
| Tool calls leaking as text (thinking off) | Prefer lower effort + thinking on; else thinking-disabled block |

## Harness interaction

- claude-forms denies extra `Agent`/`Task`/`Workflow` past budget unless the user opts in with parallel/subagent phrases.
- Do not add verification subagents to compensate — Opus already self-corrects.
- Hook reminders inject scope/search/evidence rules; this skill covers Opus-specific tuning.

## Reference

Official guide: [Prompting Claude Opus 5](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-opus-5)
