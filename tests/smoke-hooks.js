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

function runHook(hookPath, input, extraEnv = {}) {
  return spawnSync('node', [path.join(ROOT, hookPath)], {
    input: JSON.stringify(input),
    encoding: 'utf8',
    env: {
      ...process.env,
      CLAUDE_FORM_STATE_DIR: STATE_DIR,
      CLAUDE_FORM_AGENT_BUDGET: '1',
      ...extraEnv,
    },
  });
}

fs.rmSync(STATE_DIR, { recursive: true, force: true });

let failed = 0;

function check(name, condition, detail) {
  if (condition) {
    console.log(`  ✓ ${name}`);
  } else {
    console.log(`  ✗ ${name}`);
    if (detail) {
      console.log(`    ${detail}`);
    }
    failed++;
  }
}

console.log('Smoke: Claude Code hooks');
{
  const sessionId = 'smoke-claude';
  let result = runHook('.claude/hooks/session-start.js', {
    session_id: sessionId,
    hook_event_name: 'SessionStart',
  });
  check('session-start exits 0', result.status === 0, result.stderr);
  check('session-start has context', /claude-forms/.test(result.stdout));
  check(
    'session-start has plain-code guardrail',
    /descriptive names|little programming/i.test(result.stdout),
  );

  result = runHook('.claude/hooks/user-prompt.js', {
    session_id: sessionId,
    prompt: 'fix the bug',
    prompt_id: 'p1',
  });
  check('user-prompt exits 0', result.status === 0, result.stderr);

  result = runHook('.claude/hooks/pre-agent-cap.js', {
    session_id: sessionId,
    tool_name: 'Agent',
    tool_input: {},
  });
  check('first agent allowed/silent-or-warn', result.status === 0, result.stderr);

  result = runHook('.claude/hooks/pre-agent-cap.js', {
    session_id: sessionId,
    tool_name: 'Agent',
    tool_input: {},
  });
  check('second agent denied', /deny|budget/i.test(result.stdout), result.stdout);

  result = runHook('.claude/hooks/pre-write-search.js', {
    session_id: sessionId,
    tool_name: 'Write',
    tool_input: { file_path: path.join(STATE_DIR, 'new.js'), content: 'x' },
  });
  check(
    'write warn without reads',
    /Search the repo|claude-forms/i.test(result.stdout),
    result.stdout,
  );
  check(
    'write warn does not grant permission',
    !/permissionDecision/.test(result.stdout),
    result.stdout,
  );

  result = runHook(
    '.claude/hooks/pre-write-search.js',
    {
      session_id: 'smoke-strict',
      tool_name: 'Write',
      tool_input: { file_path: path.join(STATE_DIR, 'new2.js'), content: 'x' },
    },
    { CLAUDE_FORM_STRICT_SEARCH: '1' },
  );
  check(
    'strict mode denies write without reads',
    /"permissionDecision":"deny"/.test(result.stdout),
    result.stdout,
  );

  result = runHook('.claude/hooks/stop-ground.js', { session_id: sessionId });
  check(
    'first stop shows reminder',
    /systemMessage/.test(result.stdout) &&
      /plain language/i.test(result.stdout) &&
      /format/i.test(result.stdout) &&
      /entrypoint|architecture obvious/i.test(result.stdout) &&
      /edges you own|non-trivial/i.test(result.stdout),
    result.stdout,
  );
  result = runHook('.claude/hooks/stop-ground.js', { session_id: sessionId });
  check('second stop is silent', result.stdout.trim() === '', result.stdout);
}

console.log('Smoke: Cursor hooks');
{
  const conversationId = 'smoke-cursor';
  let result = runHook('.cursor/hooks/session-start.js', { conversation_id: conversationId });
  check(
    'cursor session-start',
    result.status === 0 && /claude-forms/.test(result.stdout),
    result.stdout,
  );

  result = runHook('.cursor/hooks/before-submit-prompt.js', {
    conversation_id: conversationId,
    prompt: 'use subagents please',
  });
  check(
    'cursor opt-in prompt',
    result.status === 0 && /Parallel agents enabled/i.test(result.stdout),
    result.stdout,
  );

  result = runHook('.cursor/hooks/pre-agent-cap.js', { conversation_id: conversationId });
  check(
    'cursor agent allow after opt-in',
    result.status === 0 && !/deny/i.test(result.stdout),
    result.stdout,
  );

  const budgetConversationId = 'smoke-cursor-budget';
  runHook('.cursor/hooks/session-start.js', { conversation_id: budgetConversationId });
  runHook('.cursor/hooks/before-submit-prompt.js', {
    conversation_id: budgetConversationId,
    prompt: 'fix the bug',
  });
  result = runHook('.cursor/hooks/pre-agent-cap.js', { conversation_id: budgetConversationId });
  check(
    'cursor first agent allowed',
    result.status === 0 && !/"permission"\s*:\s*"deny"/.test(result.stdout),
    result.stdout,
  );
  result = runHook('.cursor/hooks/pre-agent-cap.js', { conversation_id: budgetConversationId });
  check(
    'cursor second agent denied',
    /"permission"\s*:\s*"deny"/i.test(result.stdout),
    result.stdout,
  );

  result = runHook('.cursor/hooks/pre-write-search.js', {
    conversation_id: budgetConversationId,
    tool_name: 'Write',
    tool_input: { file_path: path.join(STATE_DIR, 'cursor-new.js'), content: 'x' },
  });
  check(
    'cursor write warn without reads',
    /Search the repo|claude-forms/i.test(result.stdout),
    result.stdout,
  );
  check(
    'cursor write warn is not a deny',
    !/"permission"\s*:\s*"deny"/.test(result.stdout),
    result.stdout,
  );

  result = runHook(
    '.cursor/hooks/pre-write-search.js',
    {
      conversation_id: 'smoke-cursor-strict',
      tool_name: 'Write',
      tool_input: { file_path: path.join(STATE_DIR, 'cursor-strict.js'), content: 'x' },
    },
    { CLAUDE_FORM_STRICT_SEARCH: '1' },
  );
  check(
    'cursor strict denies write without reads',
    /"permission"\s*:\s*"deny"/.test(result.stdout),
    result.stdout,
  );
}

console.log('Smoke: platform mirrors');
{
  const skills = ['no-overengineer', 'prompt-general', 'prompt-opus-5', 'prompt-fable-5'];
  for (const skillName of skills) {
    const claudeSkill = fs.readFileSync(
      path.join(ROOT, '.claude', 'skills', skillName, 'SKILL.md'),
    );
    const cursorSkill = fs.readFileSync(
      path.join(ROOT, '.cursor', 'skills', skillName, 'SKILL.md'),
    );
    check(`skill ${skillName} mirrors`, Buffer.compare(claudeSkill, cursorSkill) === 0);
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
