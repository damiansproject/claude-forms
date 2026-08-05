---
name: prompt-general
description: >-
  Behavior rules for most coding agents without a model-specific guide. Follow
  for scope, acting when ready, plain readable code, readable responses, and
  limited delegation. Do not use together with the Opus 5 or Fable 5 guides.
---

# General coding agent behavior

Read and follow [shared/prompt-general.md](../../../shared/prompt-general.md). Scope, search, and delegation limits also live in [shared/policy.md](../../../shared/policy.md).

## Scope and action

- Deliver only what was asked. Search before inventing; match the nearest existing implementation.
- When the request is clear and the next action is reversible, proceed. Ask only when different answers would materially change the result or the user must act.
- Do not add defensive layers, compatibility paths, feature flags, or refactors the task does not require.

## Code you write

- Prefer boring top-to-bottom code with complete descriptive names and explicit `if` / loops / `async`-`await` when clearer.
- Before finishing, read changes as a newcomer: replace abbreviations, chained transforms, compressed conditionals, and unexplained regex with plain steps.
- Use `async function main()` for hook/CLI entrypoints; `for` loops for multi-step data changes; one shared copy for duplicate install/uninstall logic.

## Tests, responses, delegation

- Tests: full-word names; describe behavior in plain language.
- Responses: lead with the outcome; complete sentences; no working shorthand or arrow chains in the final answer.
- Do the work yourself unless the task has large independent parts or the user explicitly asked for agents. Do not spawn agents to verify your own work.

## When you finish

Test what you changed, update docs your change made wrong, and stop when the request is complete.
