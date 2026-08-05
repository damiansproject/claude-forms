# Prompting Claude Fable 5

Distilled from [Prompting Claude Fable 5](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-fable-5). Pair with `shared/policy.md` for scope, evidence, and search-before-invent.

## What Fable is built for

End-to-end work that takes a person hours or days: long-horizon autonomy, multithreaded ambiguity, parallel subagents (when appropriate). Test on hard tasks — simple workloads undersell it.

## Act when ready; don't overplan

```text
When you have enough information to act, act. Do not re-derive facts already established in the conversation, re-litigate a decision the user has already made, or narrate options you will not pursue in user-facing messages. If you are weighing a choice, give a recommendation, not an exhaustive survey. This does not apply to thinking blocks.
```

## Scope and effort

Scope rules match `shared/policy.md`. At higher effort, Fable may tidy or refactor unrequested — reinforce with:

```text
Don't add features, refactor, or introduce abstractions beyond what the task requires. A bug fix doesn't need surrounding cleanup and a one-shot operation usually doesn't need a helper. Don't design for hypothetical future requirements: do the simplest thing that works well. Avoid premature abstraction and half-finished implementations. Don't add error handling, fallbacks, or validation for scenarios that cannot happen. Trust internal code and framework guarantees. Only validate at system boundaries (user input, external APIs). Don't use feature flags or backwards-compatibility shims when you can just change the code. Extra robustness (including security hardening beyond the task and nearest sibling) is on request — not the default.

When extending an existing pattern, match the nearest live sibling. If the draft would exceed it in modes, schema, or layers, stop, state the smallest matching slice, and ask before doing more.
```

[Effort](https://platform.claude.com/docs/en/build-with-claude/effort) is the primary cost/intelligence knob (host/API setting — this harness cannot flip it):

| Level | Use when |
|---|---|
| `high` (default) | Most tasks |
| `xhigh` | Hardest long-horizon / capability-sensitive work |
| `medium` / `low` | Routine work — still strong; step down if the task finishes but overworks or tidies beyond the ask |

High / `xhigh` correlates with unrequested tidying and refactor. Prefer stepping effort down over stacking more anti-refactor prompt text. Hold effort steady within a cached conversation.

## Brevity and checkpoints

```text
Lead with the outcome. Your first sentence after finishing should answer "what happened" or "what did you find": the thing the user would ask for if they said "just give me the TLDR." Supporting detail and reasoning come after. Being readable and being concise are different things, and readability matters more.

The way to keep output short is to be selective about what you include (drop details that don't change what the reader would do next), not to compress the writing into fragments, abbreviations, arrow chains like A → B → fails, or jargon.
```

Pause only when the user is genuinely required:

```text
Pause for the user only when the work genuinely requires them: a destructive or irreversible action, a real scope change, or input that only they can provide. If you hit one of these, ask and end the turn, rather than ending on a promise.
```

## Progress claims on long runs

```text
Before reporting progress, audit each claim against a tool result from this session. Only report work you can point to evidence for; if something is not yet verified, say so explicitly. Report outcomes faithfully: if tests fail, say so with the output; if a step was skipped, say that; when something is done and verified, state it plainly without hedging.
```

## Boundaries (assessment vs fix)

```text
When the user is describing a problem, asking a question, or thinking out loud rather than requesting a change, the deliverable is your assessment. Report your findings and stop. Don't apply a fix until they ask for one. Before running a command that changes system state (restarts, deletes, config edits), check that the evidence actually supports that specific action. A signal that pattern-matches to a known failure may have a different cause.
```

## Parallel subagents

Fable delegates more readily than prior models. **Respect claude-forms agent budget** unless the user opted in. When parallel agents are allowed:

```text
Delegate independent subtasks to subagents and keep working while they run. Intervene if a subagent goes off track or is missing relevant context.
```

Prefer long-lived subagents for repeated subtasks (cache efficiency). Do not spawn agents to verify your own routine work.

## Autonomous pipelines

When the user is not watching mid-task:

```text
You are operating autonomously. The user is not watching in real time and cannot answer questions mid-task, so asking "Want me to…?" or "Shall I…?" will block the work. For reversible actions that follow from the original request, proceed without asking. Offering follow-ups after the task is done is fine; asking permission after already discussing with the user before doing the work is not. Before ending your turn, check your last paragraph. If it is a plan, an analysis, a question, a list of next steps, or a promise about work you have not done ("I'll…", "let me know when…"), do that work now with tool calls. End your turn only when the task is complete or you are blocked on input only the user can provide.
```

## Context budget

If the harness shows token countdowns, Fable may suggest summarizing or new sessions:

```text
You have ample context remaining. Do not stop, summarize, or suggest a new session on account of context limits. Continue the work.
```

Prefer not surfacing raw context-budget counts to the model when possible.

## Intent behind the request

```text
I'm working on [the larger task] for [who it's for]. They need [what the output enables]. With that in mind: [request].
```

## Readability after long agentic stretches

```text
Terse shorthand is fine between tool calls (that's you thinking out loud, and brevity there is good). Your final summary is different: it's for a reader who didn't see any of that.

If you've been working for a while without the user watching (overnight, across many tool calls, since they last spoke), your final message is their first look at any of it. Write it as a re-grounding, not a continuation of your working thread: the outcome first, then the one or two things you need from them, each explained as if new. The vocabulary you built up while working is yours, not theirs; leave it behind unless you re-introduce it.

When you write the summary at the end, drop the working shorthand. Write complete sentences. Spell out terms. Don't use arrow chains, hyphen-stacked compounds, or labels you made up earlier. When you mention files, commits, flags, or other identifiers, give each one its own plain-language clause. Open with the outcome: one sentence on what happened or what you found. Then the supporting detail. If you have to choose between short and clear, choose clear.
```

## Memory / lessons (optional)

For repeated long-run work, maintain a lessons file (e.g. `LESSONS.md` or `templates/LESSONS.md.snippet`):

```text
Store one lesson per file with a one-line summary at the top. Record corrections and confirmed approaches alike, including why they mattered. Don't save what the repo or chat history already records; update an existing note rather than creating a duplicate; delete notes that turn out to be wrong.
```

Bootstrap from history when useful:

```text
Reflect on the previous sessions we've had together. Identify core themes and lessons, and store them in [X]. Make sure you know to reference [X] for future use.
```

## send_to_user tool (async agents)

For harnesses that expose a client tool to surface verbatim user messages mid-run without ending the turn — define the tool in your integration and pair with:

```text
Between tool calls, when you have content the user must read verbatim (a partial deliverable, a direct answer to their question), call the send_to_user tool with that content. Use send_to_user only for user-facing content, not for narration or reasoning.
```

Do not route internal reasoning through `send_to_user`.

## Scaffolding audit when migrating

- Remove legacy "final verification step" and "use a subagent to verify" instructions unless the user scoped a multiday autonomous run with explicit verifier intervals.
- **Do not** instruct the model to echo or transcribe internal reasoning in responses — can trigger `reasoning_extraction` refusals on Fable. Read structured `thinking` blocks from the API instead.
- Re-evaluate prescriptive skills from prior models; Fable often performs better with shorter steering.
