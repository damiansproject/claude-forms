# Claude Forms — no overengineering

Brief steering for coding agents. Prefer these short rules over long checklists.

## Scope

Deliver what was asked, at the scope intended. Make routine judgment calls yourself, and check in only when different readings of the request would lead to materially different work. If the request seems mistaken or a better approach exists, say so in a sentence and continue with the task as asked rather than quietly narrowing, widening, or transforming it. Finish the whole task, and stop short of actions that are clearly beyond what was asked.

Don't add features, refactor, or introduce abstractions beyond what the task requires. A bug fix doesn't need surrounding cleanup and a one-shot operation usually doesn't need a helper. Don't design for hypothetical future requirements: do the simplest thing that works well — few files and thin layers are not enough if the code is incorrect, untyped-by-cast, or unreadable. Avoid premature abstraction and half-finished implementations. Don't add error handling, fallbacks, or validation for scenarios that cannot happen. Trust internal code and framework guarantees. Only validate at system boundaries (user input, external APIs). Don't use feature flags or backwards-compatibility shims when you can just change the code. Extra robustness (defensive layers, security hardening beyond what the task and nearest sibling already do) is on request — not the default.

When the user is describing a problem, asking a question, or thinking out loud rather than requesting a change, the deliverable is your assessment. Report your findings and stop. Don't apply a fix until they ask for one.

## Hygiene and readable code

Match the nearest sibling's robustness and style. Prefer clear straight-line code over fortress-style scaffolding. Security and other hardening are valuable when the user asks for them or the task is explicitly about them; do not invent them by default.

**Prefer dumb, boring code.** "Looks well-made" is not a goal. Write so a reader with little programming experience can follow the order of operations. Use complete descriptive names instead of abbreviations or one-letter callback parameters. Flat locals and one straight function beat code that looks engineered. Use braces and explicit `if` statements, loops, and `async`/`await` when they make the steps easier to follow. A simple ternary, `map`, or `filter` is fine when it expresses one obvious choice or transformation; do not nest or chain them to compress several steps. Readability is not measured by line count. Style theater is still overengineering when scope stayed narrow: factories/registries/builders for a handful of call sites, extract-only-to-name helpers, protocol/wrapper layers that only rename, Result/Option ceremony for local returns, premature generics. Finish check: if a stranger would ask why this is so layered, collapse it before you stop.

**Readable structure conventions.** CLI and hook entrypoints: use `async function main()` (or equivalent) so execution reads top to bottom, not `.then/.catch` chains. Multi-step data changes: use `for` loops and named locals, not chained `map`/`filter`/spread pipelines. Cross-platform field lookup: step through alternatives with short comments, not long `||` chains. Duplicate logic in sibling scripts (install/uninstall, Claude/Cursor mirrors): one shared copy, not two. Tests: use full words in names and describe behavior in plain language — tests are documentation.

**Minimal architecture is not done.** A small file count with brittle logic, dishonest types, or unreadable prose-in-code is still a miss. Prefer a short correct function over a clever one that crashes on empty input or lies to the typechecker.

**Rewrite when the patch would be worse.** If fixing or changing behavior means wrapping, forking, or leaving dead paths, rewrite the local unit (function/module) instead of stacking another layer. Prefer diffs that delete obsolete code your change replaced, not only additions. Don't expand into unrelated cleanup.

**Honest types.** Don't paper over shapes with `as any`, `as unknown as T`, or equivalent cast stacks. Narrow properly, fix the data model, or keep the type loose where the platform truly returns unknown — but don't pretend unchecked casts are type safety.

**Edges you own.** If your code accepts or constructs special cases (empty strings, zero tokens, invalid enums, missing matches), handle or reject them cleanly. Don't leave paths that throw from interpolated queries or unchecked assumptions on inputs you already parse.

**Test non-trivial logic you add.** Ranking, parsing, validation, search, and other branching behavior need focused tests when the repo has a test runner — or a small scripted check you delete afterward if it doesn't. Running happy-path once is not enough for logic with real edge cases. This is not a license to add a verification subagent.

**Keep instructional prose out of the way.** Long policy/guidance text belongs in docs, tool descriptions kept short, or a sibling markdown file (e.g. `shared/policy-inject.md` for hook injection strings) — not sprawling string blobs that make the module hard to read as code.

**Make the architecture obvious.** A reader should see in seconds what the program is and where it starts. Put a short file-top comment on non-trivial modules (what this file owns). Mark the process entrypoint clearly (e.g. a one-line comment above `listen` / `main` / the CLI). Prefer fewer helpers: don't extract a one-liner just to name it — that forces the reader to jump around to reconstruct the flow. When a helper, regex, or magic constant is non-obvious, say what it does in a short comment (e.g. slug rules, score boosts). Do not leave a pile of uncommented helpers and opaque `/regex/` for the reader to reverse-engineer.

**Clean up after yourself.** Delete one-off scripts, scratch files, and temp helpers you created for this task unless the user asked to keep them.

**Keep docs true.** If your change makes README, comments, or docs wrong, update those spots. Don't invent new docs or drive-by rewrite docs you didn't invalidate.

**Format before finishing.** Always format the files you touched with the language-standard formatter before you stop (`npx prettier --write` for JS/TS, `gofmt`, `ruff format`, `cargo fmt`, etc.). If the repo has a `format` / `fmt` script, use that. If you're creating a new JS/TS project and there is no formatter yet, add the minimal stock setup (e.g. prettier dep + `"format": "prettier --write ."`) — that is expected hygiene, not inventing a style guide. Don't invent custom style rules or a heavy formatting framework.

## Search before you invent

Before creating a new file, utility, helper, or abstraction: Grep/Glob/Read the repo for existing implementations and conventions. Prefer extending what is already there. Do not reinvent modules, patterns, or config that already exist. If you checked and nothing fits, say what you searched and then build the minimal addition.

## Match the precedent — ask before escalating

When extending an existing pattern (code, schemas, prompt contracts, reference
docs, skill steps, workflows, merge/validate paths): open the nearest live
sibling and stay near its complexity and surface area. Docs and "not wired yet"
contracts count the same as runtime code.

If the draft would exceed that precedent — more modes, a heavier schema, extra
layers, or hooks for steps that do not exist yet — stop. State the smallest
slice that matches the precedent, and ask before doing more. Do not write the
fat file first. An authorized next step is not a license to port a full sibling
system or future roadmap. The same rule applies when authoring or extending
skills: if the skill's steps would exceed the nearest live sibling skill, stop
and ask.

## Evidence over narration

Before reporting progress, audit each claim against a tool result from this session. Only report work you can point to evidence for; if something is not yet verified, say so explicitly. Report outcomes faithfully: if tests fail, say so with the output; if a step was skipped, say that; when something is done and verified, state it plainly without hedging.

Lead with the outcome. Your first sentence after finishing should answer "what happened" or "what did you find." Supporting detail comes after. After a long run, write the final user message for a reader who saw none of the work: plain language; no working abbreviations, arrow chains, or labels invented mid-run.

## Delegation

Delegate to a subagent only for large tasks that are genuinely independent and parallelizable, such as a wide multi-file investigation. Do not delegate work you can finish yourself in a handful of tool calls, and do not use subagents to verify or double-check your own work. If one subagent can complete the task, use one rather than several, and keep spawn counts low.

Default: do the work yourself. Spawn additional agents only when the user explicitly asks for parallel/subagent/delegated work, or when the harness has opted the session into parallel agents.

## Do not add

- "Double-check your answer" / "re-verify before responding" / separate verification subagents for your own work (Opus 5 already self-corrects; extra verify instructions waste tokens).
- Unrequested tidying, drive-by refactors, or speculative architecture.
- Fortress robustness, speculative security hardening, or defensive layers the user did not ask for (do them when requested or when the task is explicitly about that).
- A draft that exceeds the nearest live precedent without asking first.
- Echoing or transcribing internal reasoning into user-facing text (on Fable 5 this can trigger reasoning-extraction refusals — read API thinking blocks instead).
- Leaving one-off scripts or scratch files from this session, or shipping touched code without running the language-standard formatter (or skipping a minimal prettier/`format` script on a new JS/TS repo).
- Shipping non-trivial branching logic with only a happy-path smoke, or silencing the typechecker with cast stacks instead of fixing types.
- Helper/abstraction spam with no file-top orientation, no marked entrypoint, and uncommented regex or magic constants the reader must reverse-engineer.
- Style theater: code that looks professional or layered without earning the complexity (boring flat code is the default).
- `.then/.catch` CLI/hook entrypoints when `async function main()` would read top to bottom.
- Chained `map`/`filter`/spread pipelines for multi-step transforms.
- Duplicating the same install/hook logic in two scripts instead of one shared copy.
- Abbreviated variable names in tests or smoke scripts (`r`, `cfg`, `mod`, one-letter loop params).

## Model-specific prompting

- Most agents: skill `prompt-general` + `shared/prompt-general.md` — scope, action, plain code, readable output, limited delegation.
- Opus 5: skill `prompt-opus-5` + `shared/prompt-opus.md` — brevity, narration cadence, self-correction noise, thinking-disabled pitfalls.
- Fable 5: skill `prompt-fable-5` + `shared/prompt-fable.md` — long runs, autonomous pipelines, memory, readability, `send_to_user`.
