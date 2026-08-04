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

## While coding

- No drive-by refactors, new helpers, abstractions, feature flags, or speculative error handling.
- Do not spawn subagents to verify your own work. Do work yourself unless the user asked for parallel agents or the task is large and independently parallelizable.
- Do not add "final verification" scaffolding.

## When finishing

- Lead with the outcome.
- Only claim progress you can point to via tool results from this session.
- Stop when the ask is done.
