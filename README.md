# claude-forms

Anti-overengineering harness for **Claude Opus 5** and **Claude Fable 5**.

Steers agents away from over-scoping, drive-by refactors, and reinventing code that already exists — via a short shared policy, always-on rules/skills, and hooks for **Claude Code** and **Cursor**.

Policy sources: [Prompting Claude Opus 5](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-opus-5), [Prompting Claude Fable 5](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-fable-5).

## What it does

| Failure mode | Soft | Hard |
|---|---|---|
| Over-scoping / unrequested refactors | Session + prompt reminders | — |
| Reinvent / ignore existing code | Search-before-write skill + warn on new `Write` with zero reads | — (warn only) |
| Hallucinated progress | Stop / finish reminder | — |
| Subagent cost explosion | Warn at last slot | Deny Agent/Task past budget unless user opts in |

**Default agent budget:** `1` per user prompt. Opt-in phrases unlock a higher budget (default `8`): `parallel`, `subagent(s)`, `delegate`, `fan out`, `use agents`, `in parallel`, `go do`, `end to end`, `autonomous`, `allow parallel agents`.

Opt-in persists for the rest of the session.

## Layout

```
claude-forms/
  shared/                 # policy + session state + handlers
  .claude/                # Claude Code settings, rules, skill, hooks
  .cursor/                # Cursor hooks.json, rules, skill, hooks
  templates/CLAUDE.md.snippet
  tests/
```

## Install

### Project drop-in

Copy into a target repo (keep `shared/` next to `.claude/` and `.cursor/`):

```bash
rsync -a shared .claude .cursor templates/CLAUDE.md.snippet /path/to/project/
# optional: append templates/CLAUDE.md.snippet into the project's CLAUDE.md
```

### Personal (user-level)

- Claude Code: copy `.claude/rules/no-overengineer.md` → `~/.claude/rules/`, skill → `~/.claude/skills/no-overengineer/`, and merge hooks from `.claude/settings.json` into `~/.claude/settings.json` (adjust paths to an absolute install of `shared/`).
- Cursor: copy `.cursor/rules/no-overengineer.mdc` and `.cursor/skills/no-overengineer/`, merge `.cursor/hooks.json` (paths assume project-root `shared/`).

## Environment overrides

| Variable | Effect |
|---|---|
| `CLAUDE_FORM_DISABLED=1` | Disable all handlers |
| `CLAUDE_FORM_ALLOW_PARALLEL=1` | Session starts with parallel agents allowed |
| `CLAUDE_FORM_AGENT_BUDGET` | Per-prompt agent budget when not opted in (default `1`) |
| `CLAUDE_FORM_PARALLEL_BUDGET` | Budget when opted in (default `8`) |
| `CLAUDE_FORM_STATE_DIR` | Override `/tmp/claude-forms` state directory |

## Tests

```bash
npm test
```

## Rename note

This package lives at `claude-forms`. If you still have a checkout named `claude-code-forms` / `claude-code-form`, rename the directory (and optionally `gh repo rename claude-forms` on GitHub). Do not force-push.

## v2 ideas

- Memory/lessons file pattern (Fable)
- Optional stricter search-before-write deny mode
