---
name: no-overengineer
description: >-
  Prevents overengineering, over-scoping, and reinventing existing code for Claude
  Opus 5 and Fable 5. Use when implementing features, fixing bugs, refactoring,
  writing new files/utilities, spawning subagents, or when the model risks
  expanding scope or ignoring repo conventions.
---

# No overengineering

Read and follow [shared/policy.md](../../../shared/policy.md) (project root). Summary:

## Before coding

1. Restate the asked scope in one sentence (internally). Do not widen it.
2. Search the repo (`Grep` / `Glob` / `Read`) for existing code that already does the job.
3. Prefer the smallest change that satisfies the request.
4. If mirroring an existing pattern, open the nearest sibling and stay near its complexity. If the draft would exceed it (modes, schema, layers), stop and ask — do not write the fat file first.
5. Same for skills: if this skill's steps would exceed the nearest live sibling skill in the repo, stop and ask.

## While coding

- No drive-by refactors, new helpers, abstractions, feature flags, or speculative error handling.
- Extra robustness / security hardening only when requested (or the task is explicitly about that).
- Prefer rewriting a local unit over stacking patches that leave dead paths; delete obsolete code your change replaced.
- Do not spawn subagents to verify your own work. Do work yourself unless the user asked for parallel agents or the task is large and independently parallelizable.
- Do not add "final verification" scaffolding.

## When finishing

- Delete one-off scripts / scratch files you created unless asked to keep them.
- Update docs your change made wrong; don't invent new docs.
- Run the repo's existing formatter on files you touched (don't invent a formatter config).
- Lead with the outcome.
- Only claim progress you can point to via tool results from this session.
- Final user message: plain language for a reader who saw none of the work — no working abbreviations, arrow chains, or mid-run labels.
- Stop when the ask is done.

## See also

- `prompt-opus-5` — verbosity, narration, Opus-specific scaffolding ([guide](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-opus-5))
- `prompt-fable-5` — long runs, autonomy, memory ([guide](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-fable-5))
