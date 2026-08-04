'use strict';

/**
 * Smoke: pipe sample Claude Code / Cursor stdin JSON into hooks.
 * Run: node tests/smoke-hooks.js
 */

const { spawnSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');

const ROOT = path.join(__dirname, '..');
const STATE_DIR = path.join(os.tmpdir(), `claude-forms-smoke-${process.pid}`);

function runHook(rel, input) {
  const result = spawnSync('node', [path.join(ROOT, rel)], {
    input: JSON.stringify(input),
    encoding: 'utf8',
    env: {
      ...process.env,
      CLAUDE_FORM_STATE_DIR: STATE_DIR,
      CLAUDE_FORM_AGENT_BUDGET: '1',
    },
  });
  return result;
}

fs.rmSync(STATE_DIR, { recursive: true, force: true });

let failed = 0;

function check(name, cond, detail) {
  if (cond) {
    console.log(`  ✓ ${name}`);
  } else {
    console.log(`  ✗ ${name}`);
    if (detail) console.log(`    ${detail}`);
    failed++;
  }
}

console.log('Smoke: Claude Code hooks');
{
  const sid = 'smoke-claude';
  let r = runHook('.claude/hooks/session-start.js', {
    session_id: sid,
    hook_event_name: 'SessionStart',
  });
  check('session-start exits 0', r.status === 0, r.stderr);
  check('session-start has context', /claude-forms/.test(r.stdout));

  r = runHook('.claude/hooks/user-prompt.js', {
    session_id: sid,
    prompt: 'fix the bug',
    prompt_id: 'p1',
  });
  check('user-prompt exits 0', r.status === 0, r.stderr);

  r = runHook('.claude/hooks/pre-agent-cap.js', {
    session_id: sid,
    tool_name: 'Agent',
    tool_input: {},
  });
  check('first agent allowed/silent-or-warn', r.status === 0, r.stderr);

  r = runHook('.claude/hooks/pre-agent-cap.js', {
    session_id: sid,
    tool_name: 'Agent',
    tool_input: {},
  });
  check('second agent denied', /deny|budget/i.test(r.stdout), r.stdout);

  r = runHook('.claude/hooks/pre-write-search.js', {
    session_id: sid,
    tool_name: 'Write',
    tool_input: { file_path: path.join(STATE_DIR, 'new.js'), content: 'x' },
  });
  check('write warn without reads', /Search the repo|claude-forms/i.test(r.stdout), r.stdout);
}

console.log('Smoke: Cursor hooks');
{
  const sid = 'smoke-cursor';
  let r = runHook('.cursor/hooks/session-start.js', { session_id: sid });
  check('cursor session-start', r.status === 0 && /claude-forms/.test(r.stdout), r.stdout);

  r = runHook('.cursor/hooks/before-submit-prompt.js', {
    session_id: sid,
    prompt: 'use subagents please',
  });
  check('cursor opt-in prompt', r.status === 0 && /Parallel agents enabled/i.test(r.stdout), r.stdout);

  r = runHook('.cursor/hooks/pre-agent-cap.js', { session_id: sid });
  check('cursor agent allow after opt-in', r.status === 0 && /"permission":"allow"/.test(r.stdout), r.stdout);
}

fs.rmSync(STATE_DIR, { recursive: true, force: true });

if (failed) {
  console.error(`\n${failed} smoke check(s) failed`);
  process.exit(1);
}
console.log('\nAll smoke checks passed');
