# No overengineering (Claude Opus 5 / Fable 5)

Deliver only what was asked. Do not widen scope, refactor adjacently, or invent abstractions for hypothetical futures.

Before creating new files or utilities, search the repo (`Grep`/`Glob`/`Read`) and extend existing code when it fits.

Default: do the work yourself. Do not spawn subagents to verify your own work. Extra agents only for large independent parallel tracks or when the user explicitly opts in.

Lead with the outcome. Claim only work evidenced by tool results from this session.

Full policy: see `shared/policy.md` in the claude-forms project (or the copy installed with this harness).
