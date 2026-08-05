# claude-forms

Anti-overengineering harness for coding agents, with model-specific guidance for **Claude Opus 5** and **Claude Fable 5**.

Steers agents away from over-scoping, drive-by refactors, and reinventing code that already exists — via a short shared policy, always-on rules/skills, and hooks for **Claude Code** and **Cursor**.

Model-specific sources: [Prompting Claude Opus 5](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-opus-5), [Prompting Claude Fable 5](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-fable-5).

## What it does

| Failure mode | Soft | Hard |
|---|---|---|
| Over-scoping / unrequested refactors | Session + prompt reminders | — |
| Plan drift (substitutes approach, skips steps of an agreed plan) | Follow-the-agreed-plan section (rule, Opus skill, session/prompt/stop injects) | — |
| Messy long-run diff (abandoned-approach leftovers, drifted names, debug prints) | Own-diff one-pass rule (rule, Fable skill, stop inject) | — |
| In-scope overbuild (exceeds live precedent) | Ask-before-escalate checkpoint (policy, skills, session inject) | — |
| Fortress code / unrequested robustness | Hygiene section (robustness on request); effort guidance | — |
| Style theater (looks engineered, unearned layers) | Prefer dumb/boring flat code (policy + skill + session inject) | — |
| Brittle minimal code (bad edges, cast stacks, no tests, prose-in-code) | Craft rules in Hygiene + Stop finish reminder | — |
| Unreadable structure (no entrypoint mark, helper spam, opaque regex) | Architecture-obvious rules in Hygiene + Stop | — |
| Patch stacks / leftover one-offs / stale docs / unformatted edits | Hygiene section + Stop finish reminder (always format; add minimal prettier on new JS/TS) | — |
| Reinvent / ignore existing code | Search-before-write skill + warn on new `Write` with zero reads since the last user prompt | Optional deny (`CLAUDE_FORM_STRICT_SEARCH=1`) |
| Hallucinated progress | Stop / finish reminder (once per user prompt) | — |
| Subagent cost explosion | Warn at last slot | Deny Agent/Task/Workflow past budget unless user opts in |

**Default agent budget:** `1` per user prompt. Opt-in phrases unlock a higher budget (default `8`): `subagent(s)`, `parallel agents`, `in parallel`, `use/spawn … agents`, `multiple agents`, `fan out`, `delegate this/it`, `autonomously`, `go do`. Bare `parallel`, `delegate`, `autonomous`, and `end to end` intentionally do **not** opt in — they show up in ordinary coding asks ("add an end to end test", "implement the delegate pattern").

Opt-in persists for the rest of the session, including across compaction and resume.

## Layout

```
claude-forms/
  shared/                 # policy, general/model prompt refs, session state, handlers
  .claude/                # Claude Code settings, rules, skills, hooks (canonical)
  .cursor/                # Cursor hooks + mirrored rules/skills (from .claude via npm run sync)
  templates/              # CLAUDE.md.snippet, LESSONS.md.snippet
  scripts/                # sync-platform, install-user
  tests/
```

Edit **`.claude/rules/no-overengineer.md`** (always-on policy) and **`.claude/skills/prompt-*/SKILL.md`** (model-specific), then run `npm run sync` (also runs at the start of `npm test`). Sync mirrors the rule into `shared/policy.md`, the `no-overengineer` skill, and Cursor.

## Skills

| Skill | When to use |
|---|---|
| `no-overengineer` | Always-on rule (full policy); skill mirrors the same text when invoked |
| `prompt-general` | General agent behavior (scope, action, plain code, readable output) |
| `prompt-opus-5` | Opus 5: brevity, narration cadence, subagent limits, self-correction noise |
| `prompt-fable-5` | Fable 5: long runs, autonomy, progress evidence, readability, `send_to_user` |

Extended behavior text (mirrored from skills on `npm run sync`): `shared/prompt-general.md`, `shared/prompt-opus.md`, `shared/prompt-fable.md`. **Edit `.claude/skills/prompt-*/SKILL.md`** — that is what loads when you invoke the skill.

## Install

### Project drop-in

Copy into a target repo (keep `shared/` next to `.claude/` and `.cursor/`):

```bash
# Unix
rsync -a shared .claude .cursor templates /path/to/project/
# Windows (PowerShell)
Copy-Item -Recurse shared, .claude, .cursor, templates /path/to/project/
# optional: append templates/CLAUDE.md.snippet into the project's CLAUDE.md
# optional: copy templates/LESSONS.md.snippet → LESSONS.md for Fable long-run memory
```

### System-wide (all projects)

Install once; hooks, rules, and skills apply everywhere. Merges with your existing Claude/Cursor hook config (does not remove other hooks). Works on Windows, macOS, and Linux (uses `fs.cpSync`, no `rsync`).

```bash
cd /path/to/claude-forms
npm run install:user
```

Default install root: `~/.local/share/claude-forms` (or `%USERPROFILE%\.local\share\claude-forms` on Windows). Override with `CLAUDE_FORM_INSTALL_DIR`.

Installs:
- Runtime (`shared/`, hooks) → install root
- `~/.claude/settings.json` — hooks merged
- `~/.cursor/hooks.json` — hooks merged
- `~/.claude/rules/`, `~/.cursor/rules/` — `no-overengineer`
- `~/.claude/skills/`, `~/.cursor/skills/` — all claude-forms skills (paths patched)

Re-run after upgrading claude-forms. If a project also has a project-level copy, both hook sets fire for each event; the handlers share session state and treat the second firing as a duplicate, so reminders inject once and (on Claude Code) the agent budget is consumed once per tool call. Dedupe only works when both copies are current — re-run `npm run install:user` after upgrading. `CLAUDE_FORM_DISABLED=1` still turns the harness off entirely in a project.

```bash
npm run uninstall:user          # strip hooks/rules/skills; leave install root
npm run uninstall:user -- --purge   # also delete the install root
```

### Personal (manual)

Same as system-wide but by hand: copy rules/skills, merge hooks with absolute paths to your install root (see `scripts/install-user.js`).

## Environment overrides

| Variable | Effect |
|---|---|
| `CLAUDE_FORM_DISABLED=1` | Disable all handlers |
| `CLAUDE_FORM_ALLOW_PARALLEL=1` | Session starts with parallel agents allowed |
| `CLAUDE_FORM_AGENT_BUDGET` | Per-prompt agent budget when not opted in (default `1`) |
| `CLAUDE_FORM_PARALLEL_BUDGET` | Budget when opted in (default `8`) |
| `CLAUDE_FORM_STRICT_SEARCH=1` | Deny (instead of warn on) new-file writes with zero Read/Grep/Glob since the last user prompt |
| `CLAUDE_FORM_STATE_DIR` | Override state directory (default: `os.tmpdir()/claude-forms`) |

## Platform notes

- **Claude Code:** warn paths inject `additionalContext` only — they never set `permissionDecision`, so your normal permission prompts are untouched. Session state survives `compact`/`resume`/`fork` (SessionStart `source`) and the policy summary is re-injected after compaction. Search-before-write hooks match `Write` only (`Edit` is existing-file).
- **Cursor:** state is keyed by `conversation_id`. `beforeSubmitPrompt` can't inject agent-visible context (the always-apply rule carries the policy); opt-in detection surfaces as a `user_message`. There is no stop hook — Cursor's `stop` event only supports `followup_message`, which would force an extra agent turn. `subagentStart` carries no tool-call id, so overlapping installs still double-count agent slots on Cursor (reminder dedupe works everywhere).

## Tests

```bash
npm test          # sync platform mirrors, unit tests, smoke
npm run smoke     # hooks smoke only
npm run sync      # refresh .cursor skills/rules from .claude
```
