# Prompting Claude Opus 5

Distilled from [Prompting Claude Opus 5](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-opus-5). Pair with `shared/policy.md` for scope and search-before-invent.

## Defaults that differ from prior Opus

- Strong on agentic coding and long-context work without extra scaffolding.
- Self-corrects and verifies its own work — **do not** add double-check / re-verify / verification subagent instructions (they cause over-verification).
- Delegates to subagents more readily — the claude-forms harness caps this unless the user opts in.
- User-facing responses and written deliverables tend to be longer than prior Opus models.

## Effort

Effort ([docs](https://platform.claude.com/docs/en/build-with-claude/effort)) controls thinking volume and tool-call thoroughness, not visible length. Set it in the host/API (`output_config.effort`, Cursor / Claude Code effort UI) — this harness cannot flip it.

- Start at `high` (API default). Use `low` / `medium` liberally wherever quality holds — Opus 5 is strong at lower effort.
- Step up to `xhigh` / `max` only for demanding coding and agentic work your evals need.
- Prefer thinking on + lower effort over disabling thinking.
- Hold effort steady within a cached conversation (changing it breaks prefix cache).

## Response length

Effort does not reliably shorten visible answers. Prompt for brevity explicitly when needed:

```text
Keep responses focused, brief, and concise. Keep disclaimers and caveats short, and spend most of the response on the main answer. When asked to explain something, give a high-level summary unless an in-depth explanation is specifically requested.
```

For long system prompts, repeat near the end:

```text
Keep outputs reasonably concise.
```

## Progress updates during agentic work

Opus narrates more during tool use. Tune cadence explicitly:

```text
Before your first tool call, say in one sentence what you're about to do. While working, give a brief update only when you find something important or change direction. When you finish, lead with the outcome: your first sentence should answer "what happened" or "what did you find," with supporting detail after it for readers who want it.
```

## Written deliverables (files on disk)

Reports and Markdown files are often longer than on prior models:

```text
Match the length of written documents to what the task needs: cover the substance, but do not pad with filler sections, redundant summaries, or boilerplate.
```

## Task scope

See `shared/policy.md` for the full scope rule. Opus-specific framing:

```text
Deliver what was asked, at the scope intended. Make routine judgment calls yourself, and check in only when different readings of the request would lead to materially different work. If the request seems mistaken or a better approach exists, say so in a sentence and continue with the task as asked rather than quietly narrowing, widening, or transforming it. Finish the whole task, and stop short of actions that are clearly beyond what was asked.

When extending an existing pattern, match the nearest live sibling. If the draft would exceed it in modes, schema, or layers, stop, state the smallest matching slice, and ask before doing more.
```

## Subagent spawning

Align with harness budget (default: one agent per user prompt). When the user opts in or the task is a wide independent investigation:

```text
Delegate to a subagent only for large tasks that are genuinely independent and parallelizable, such as a wide multi-file investigation. Do not delegate work you can finish yourself in a handful of tool calls, and do not use subagents to verify or double-check your own work. If one subagent can complete the task, use one rather than several, and keep spawn counts low.
```

## Self-correction narration

Opus narrates minor self-corrections more than prior models:

```text
Only correct an earlier statement when the error would change the user's code, conclusions, or decisions. State corrections plainly and briefly, then continue the task. For slips that change nothing for the user, make the fix and move on without noting it.
```

## Thinking disabled (integrations only)

Prefer thinking on and lower effort instead of disabling thinking. If thinking must stay off, tool calls may leak as text and internal XML tags may appear:

```text
When you use a tool, you may say a brief sentence first. If no tool can express what the user asked for, say so instead of guessing. Do not include internal or system XML tags in your response.
```

Remove system-prompt rules that forbid thinking — they increase tag leakage.
