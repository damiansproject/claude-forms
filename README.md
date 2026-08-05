# claude-forms

Anti-overengineering harness for **Claude Opus 5** and **Claude Fable 5**.

Steers agents away from over-scoping, drive-by refactors, and reinventing code that already exists — via a short shared policy, always-on rules/skills, and hooks for **Claude Code** and **Cursor**.

Policy sources: [Prompting Claude Opus 5](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-opus-5), [Prompting Claude Fable 5](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-fable-5).

## What it does

| Failure mode | Soft | Hard |
|---|---|---|
| Over-scoping / unrequested refactors | Session + prompt reminders | — |
| In-scope overbuild (exceeds live precedent) | Ask-before-escalate checkpoint (policy, skills, session inject) | — |
| Reinvent / ignore existing code | Search-before-write skill + warn on new `Write` with zero reads | Optional deny (`CLAUDE_FORM_STRICT_SEARCH=1`) |
| Hallucinated progress | Stop / finish reminder (once per session) | — |
| Subagent cost explosion | Warn at last slot | Deny Agent/Task/Workflow past budget unless user opts in |

**Default agent budget:** `1` per user prompt. Opt-in phrases unlock a higher budget (default `8`): `subagent(s)`, `parallel agents`, `in parallel`, `use/spawn … agents`, `multiple agents`, `fan out`, `delegate this/it`, `autonomously`, `go do`. Bare `parallel`, `delegate`, `autonomous`, and `end to end` intentionally do **not** opt in — they show up in ordinary coding asks ("add an end to end test", "implement the delegate pattern").

Opt-in persists for the rest of the session, including across compaction and resume.

## Layout

```
claude-forms/
  shared/                 # policy, prompt-opus/fable refs, session state, handlers
  .claude/                # Claude Code settings, rules, skills, hooks (canonical)
  .cursor/                # Cursor hooks + mirrored rules/skills (from .claude via npm run sync)
  templates/              # CLAUDE.md.snippet, LESSONS.md.snippet
  scripts/                # sync-platform, install-user
  tests/
```

Edit skills/rules under `.claude/`, then run `npm run sync` (also runs at the start of `npm test`).

## Skills

| Skill | When to use |
|---|---|
| `no-overengineer` | Scope, search-before-invent, delegation limits (always-on rule mirrors this) |
| `prompt-opus-5` | Tune Opus verbosity, narration, deliverable length, subagent guidance |
| `prompt-fable-5` | Long runs, autonomy, memory, readability, async `send_to_user` |

Shared reference text (copy into `CLAUDE.md` or read via skills): `shared/prompt-opus.md`, `shared/prompt-fable.md`.

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

Re-run after upgrading claude-forms. If a project also has a project-level copy, hooks may run twice — use `CLAUDE_FORM_DISABLED=1` in that project or remove the project drop-in.

### Personal (manual)

Same as system-wide but by hand: copy rules/skills, merge hooks with absolute paths to your install root (see `scripts/install-user.js`).

## Environment overrides

| Variable | Effect |
|---|---|
| `CLAUDE_FORM_DISABLED=1` | Disable all handlers |
| `CLAUDE_FORM_ALLOW_PARALLEL=1` | Session starts with parallel agents allowed |
| `CLAUDE_FORM_AGENT_BUDGET` | Per-prompt agent budget when not opted in (default `1`) |
| `CLAUDE_FORM_PARALLEL_BUDGET` | Budget when opted in (default `8`) |
| `CLAUDE_FORM_STRICT_SEARCH=1` | Deny (instead of warn on) new-file writes with zero Read/Grep/Glob in the session |
| `CLAUDE_FORM_STATE_DIR` | Override state directory (default: `os.tmpdir()/claude-forms`) |

## Platform notes

- **Claude Code:** warn paths inject `additionalContext` only — they never set `permissionDecision`, so your normal permission prompts are untouched. Session state survives `compact`/`resume`/`fork` (SessionStart `source`) and the policy summary is re-injected after compaction. Search-before-write hooks match `Write` only (`Edit` is existing-file).
- **Cursor:** state is keyed by `conversation_id`. `beforeSubmitPrompt` can't inject agent-visible context (the always-apply rule carries the policy); opt-in detection surfaces as a `user_message`. There is no stop hook — Cursor's `stop` event only supports `followup_message`, which would force an extra agent turn.

## Tests

```bash
npm test          # sync platform mirrors, unit tests, smoke
npm run smoke     # hooks smoke only
npm run sync      # refresh .cursor skills/rules from .claude
```
