---
name: no-overengineer
description: >-
  Prevents overengineering, over-scoping, and reinventing existing code. Use when
  implementing features, fixing bugs, refactoring, writing new files/utilities,
  spawning subagents, or when the model risks expanding scope or ignoring repo
  conventions.
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
- Prefer dumb boring flat code over style theater (factories/registries for few call sites, extract-for-naming, wrappers that only rename, Result ceremony for local returns).
- Write so a reader with little programming experience can follow the order of operations.
- Use complete descriptive names instead of abbreviations or one-letter callback parameters.
- Use braces and explicit `if` statements, loops, and `async`/`await` when they make sequential steps clearer.
- Simple ternaries or collection methods are fine for one obvious choice or transformation; do not nest or chain them to compress several steps.
- CLI/hook entrypoints: `async function main()` so execution reads top to bottom, not `.then/.catch` chains.
- Multi-step transforms: `for` loops and named locals, not chained `map`/`filter`/spread pipelines.
- Duplicate sibling logic (install/uninstall): one shared copy, not two.
- Tests: full-word names; tests document behavior in plain language.
- Minimal files ≠ done: handle edges you own, keep types honest (no `as unknown as` stacks), keep long instructional prose out of hot paths.
- Make architecture obvious: short file-top orientation, mark the entrypoint, prefer fewer jump-around helpers, comment non-obvious regex/magic.
- Do not spawn subagents to verify your own work. Do work yourself unless the user asked for parallel agents or the task is large and independently parallelizable.
- Do not add "final verification" scaffolding.

## When finishing

- Exercise edges you own; add or run focused tests for non-trivial branching you introduced (not a verify-subagent).
- Before finishing: if a stranger would ask why this is so layered, collapse it to straight-line code and a couple of locals.
- Delete one-off scripts / scratch files you created unless asked to keep them.
- Update docs your change made wrong; don't invent new docs.
- Always format touched files with the language-standard formatter; on new JS/TS repos add minimal prettier + `format` script if missing.
- Lead with the outcome.
- Only claim progress you can point to via tool results from this session.
- Final user message: plain language for a reader who saw none of the work — no working abbreviations, arrow chains, or mid-run labels.
- Stop when the ask is done.

## See also

- `prompt-general` — general agent behavior (see skill + `shared/prompt-general.md`)
- `prompt-opus-5` — Opus 5 behavior ([guide](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-opus-5))
- `prompt-fable-5` — Fable 5 behavior ([guide](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-fable-5))
