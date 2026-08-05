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

function runHook(rel, input, extraEnv = {}) {
  const result = spawnSync('node', [path.join(ROOT, rel)], {
    input: JSON.stringify(input),
    encoding: 'utf8',
    env: {
      ...process.env,
      CLAUDE_FORM_STATE_DIR: STATE_DIR,
      CLAUDE_FORM_AGENT_BUDGET: '1',
      ...extraEnv,
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
  check(
    'write warn does not grant permission',
    !/permissionDecision/.test(r.stdout),
    r.stdout
  );

  r = runHook(
    '.claude/hooks/pre-write-search.js',
    {
      session_id: 'smoke-strict',
      tool_name: 'Write',
      tool_input: { file_path: path.join(STATE_DIR, 'new2.js'), content: 'x' },
    },
    { CLAUDE_FORM_STRICT_SEARCH: '1' }
  );
  check('strict mode denies write without reads', /"permissionDecision":"deny"/.test(r.stdout), r.stdout);

  r = runHook('.claude/hooks/stop-ground.js', { session_id: sid });
  check('first stop shows reminder', /systemMessage/.test(r.stdout) && /plain language/i.test(r.stdout) && /formatter/i.test(r.stdout), r.stdout);
  r = runHook('.claude/hooks/stop-ground.js', { session_id: sid });
  check('second stop is silent', r.stdout.trim() === '', r.stdout);
}

console.log('Smoke: Cursor hooks');
{
  // Cursor payloads carry conversation_id, not session_id.
  const cid = 'smoke-cursor';
  let r = runHook('.cursor/hooks/session-start.js', { conversation_id: cid });
  check('cursor session-start', r.status === 0 && /claude-forms/.test(r.stdout), r.stdout);

  r = runHook('.cursor/hooks/before-submit-prompt.js', {
    conversation_id: cid,
    prompt: 'use subagents please',
  });
  check('cursor opt-in prompt', r.status === 0 && /Parallel agents enabled/i.test(r.stdout), r.stdout);

  r = runHook('.cursor/hooks/pre-agent-cap.js', { conversation_id: cid });
  check('cursor agent allow after opt-in', r.status === 0 && !/deny/i.test(r.stdout), r.stdout);

  // Fresh session without opt-in: first agent ok, second denied.
  const cid2 = 'smoke-cursor-budget';
  runHook('.cursor/hooks/session-start.js', { conversation_id: cid2 });
  runHook('.cursor/hooks/before-submit-prompt.js', {
    conversation_id: cid2,
    prompt: 'fix the bug',
  });
  r = runHook('.cursor/hooks/pre-agent-cap.js', { conversation_id: cid2 });
  check('cursor first agent allowed', r.status === 0 && !/"permission"\s*:\s*"deny"/.test(r.stdout), r.stdout);
  r = runHook('.cursor/hooks/pre-agent-cap.js', { conversation_id: cid2 });
  check('cursor second agent denied', /"permission"\s*:\s*"deny"/i.test(r.stdout), r.stdout);

  r = runHook('.cursor/hooks/pre-write-search.js', {
    conversation_id: cid2,
    tool_name: 'Write',
    tool_input: { file_path: path.join(STATE_DIR, 'cursor-new.js'), content: 'x' },
  });
  check('cursor write warn without reads', /Search the repo|claude-forms/i.test(r.stdout), r.stdout);
  check('cursor write warn is not a deny', !/"permission"\s*:\s*"deny"/.test(r.stdout), r.stdout);

  r = runHook(
    '.cursor/hooks/pre-write-search.js',
    {
      conversation_id: 'smoke-cursor-strict',
      tool_name: 'Write',
      tool_input: { file_path: path.join(STATE_DIR, 'cursor-strict.js'), content: 'x' },
    },
    { CLAUDE_FORM_STRICT_SEARCH: '1' }
  );
  check('cursor strict denies write without reads', /"permission"\s*:\s*"deny"/.test(r.stdout), r.stdout);
}

console.log('Smoke: platform mirrors');
{
  const skills = ['no-overengineer', 'prompt-opus-5', 'prompt-fable-5'];
  for (const name of skills) {
    const a = fs.readFileSync(path.join(ROOT, '.claude', 'skills', name, 'SKILL.md'));
    const b = fs.readFileSync(path.join(ROOT, '.cursor', 'skills', name, 'SKILL.md'));
    check(`skill ${name} mirrors`, Buffer.compare(a, b) === 0);
  }
  const rule = fs.readFileSync(path.join(ROOT, '.cursor', 'rules', 'no-overengineer.mdc'), 'utf8');
  check('cursor rule has alwaysApply frontmatter', /alwaysApply:\s*true/.test(rule));
  check('cursor rule has policy body', /Deliver only what was asked/.test(rule));
}

fs.rmSync(STATE_DIR, { recursive: true, force: true });

if (failed) {
  console.error(`\n${failed} smoke check(s) failed`);
  process.exit(1);
}
console.log('\nAll smoke checks passed');
