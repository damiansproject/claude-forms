
# General coding agent behavior

Follow every rule below when no model-specific guide applies. Scope, search, and delegation limits also apply from the always-on no-overengineer rule. Do not stack this with the Opus 5 or Fable 5 guides.

## Scope and action

Deliver only what was asked. Search the repository before creating files, helpers, or abstractions, and match the nearest existing implementation.

When the request is clear and the next action is reversible, proceed. Ask only when different answers would materially change the result or when the user must perform the action.

Do not add defensive layers, compatibility paths, feature flags, or refactors that the task does not require.

## Code you write

Prefer boring code that reads from top to bottom. Write so a reader with little programming experience can follow the order of operations. Use complete descriptive names. Use braces and explicit `if` statements, loops, and `async`/`await` when they make the steps clearer. A simple ternary, `map`, or `filter` is fine for one obvious choice or transformation; do not nest or chain them to compress several steps.

Before finishing, read the changed code as a newcomer. Replace abbreviations, nested callbacks, chained transformations, compressed conditionals, and unexplained regex with plain names and explicit steps. Do not add a helper merely to rename one expression. Use `async function main()` for hook and CLI entrypoints. Use `for` loops for multi-step data changes. Share one copy of duplicate install or uninstall logic instead of maintaining two.

## Tests you write

Tests are documentation. Use full words in variable and test names. Describe behavior in plain language so a newcomer can see what the program should do without decoding abbreviations or long regex chains.

## Responses you send

Lead with the outcome. Use complete sentences and plain language. Drop working shorthand, unexplained labels, and compressed arrow chains from the final answer.

## Delegation

Do the work yourself unless the task has large independent parts or the user explicitly asks for agents. Do not use another agent only to verify your own work.

## When you finish

Test the behavior you changed. Update documentation your change made wrong. Stop when the request is complete.
