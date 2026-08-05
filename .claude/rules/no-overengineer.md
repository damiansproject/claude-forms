# No overengineering (Claude Opus 5 / Fable 5)

Deliver only what was asked. Do not widen scope, refactor adjacently, or invent abstractions for hypothetical futures.

Before creating new files or utilities, search the repo (`Grep`/`Glob`/`Read`) and extend existing code when it fits.

When extending an existing pattern, match the nearest live sibling. If the draft would exceed it in modes, schema, or layers — including docs and "not wired yet" contracts — stop, state the smallest matching slice, and ask before doing more.

Default: do the work yourself. Do not spawn subagents to verify your own work. Extra agents only for large independent parallel tracks or when the user explicitly opts in.

Readable code over fortress code. Extra robustness and security hardening only when requested (or the task is explicitly about that). Prefer rewriting a local unit over stacking patches that leave dead paths. Delete one-off scripts you created. Update docs your change makes wrong. Run the repo's existing formatter on files you touched.

Lead with the outcome. Claim only work evidenced by tool results from this session. Final user message: plain language for a reader who saw none of the work — drop working shorthand.

Full policy: see `shared/policy.md` in the claude-forms project.
