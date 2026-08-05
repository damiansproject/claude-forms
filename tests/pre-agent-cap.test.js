'use strict';

const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');

const STATE_DIR = path.join(os.tmpdir(), `claude-forms-agent-test-${process.pid}`);

describe('pre-agent budget', () => {
  let hookHandlers;
  let sessionState;

  beforeEach(() => {
    process.env.CLAUDE_FORM_STATE_DIR = STATE_DIR;
    process.env.CLAUDE_FORM_AGENT_BUDGET = '1';
    process.env.CLAUDE_FORM_PARALLEL_BUDGET = '8';
    delete process.env.CLAUDE_FORM_ALLOW_PARALLEL;
    delete process.env.CLAUDE_FORM_DISABLED;
    delete process.env.CLAUDE_FORM_STRICT_SEARCH;
    fs.rmSync(STATE_DIR, { recursive: true, force: true });
    delete require.cache[require.resolve('../shared/session-state')];
    delete require.cache[require.resolve('../shared/handlers')];
    delete require.cache[require.resolve('../shared/detect-opt-in')];
    delete require.cache[require.resolve('../shared/policy')];
    sessionState = require('../shared/session-state');
    hookHandlers = require('../shared/handlers');
    hookHandlers.handleSessionStart('agent-test');
  });

  afterEach(() => {
    fs.rmSync(STATE_DIR, { recursive: true, force: true });
  });

  it('allows first agent then denies second without opt-in', () => {
    const firstResult = hookHandlers.handlePreAgent('agent-test');
    assert.equal(firstResult.allowed, true);
    const secondResult = hookHandlers.handlePreAgent('agent-test');
    assert.equal(secondResult.allowed, false);
    assert.match(secondResult.reason, /budget exhausted/i);
  });

  it('allows more agents after opt-in', () => {
    hookHandlers.handleUserPrompt('agent-test', 'please use subagents in parallel', 'p1');
    const agentResults = [];
    for (let index = 0; index < 3; index++) {
      agentResults.push(hookHandlers.handlePreAgent('agent-test'));
    }
    for (const agentResult of agentResults) {
      assert.equal(agentResult.allowed, true);
    }
  });

  it('warns when consuming the last default slot', () => {
    const firstResult = hookHandlers.handlePreAgent('agent-test');
    assert.equal(firstResult.allowed, true);
    assert.ok(firstResult.warn);
  });

  it('search warn only for new Write with zero reads', () => {
    const missing = path.join(STATE_DIR, 'brand-new-file.js');
    const writeResult = hookHandlers.handlePreWrite('agent-test', 'Write', missing);
    assert.ok(writeResult.context);
    assert.match(writeResult.context, /Search the repo/i);
    assert.equal(writeResult.deny, false);

    hookHandlers.handleTrackRead('agent-test');
    const afterRead = hookHandlers.handlePreWrite('agent-test', 'Write', missing);
    assert.equal(afterRead.context, null);

    // Edit never warns even at zero reads — reset and check
    hookHandlers.handleSessionStart('edit-test');
    const editResult = hookHandlers.handlePreWrite('edit-test', 'Edit', missing);
    assert.equal(editResult.context, null);
  });

  it('strict mode denies new Write with zero reads', () => {
    process.env.CLAUDE_FORM_STRICT_SEARCH = '1';
    const missing = path.join(STATE_DIR, 'brand-new-file.js');
    const writeResult = hookHandlers.handlePreWrite('agent-test', 'Write', missing);
    assert.equal(writeResult.deny, true);
    assert.match(writeResult.context, /Blocked/i);

    hookHandlers.handleTrackRead('agent-test');
    const afterRead = hookHandlers.handlePreWrite('agent-test', 'Write', missing);
    assert.equal(afterRead.deny, false);
    assert.equal(afterRead.context, null);
  });

  it('preserves opt-in across compact/resume, resets on startup', () => {
    hookHandlers.handleUserPrompt('agent-test', 'use subagents please', 'p1');
    assert.equal(sessionState.loadState('agent-test').allowParallel, true);

    hookHandlers.handleSessionStart('agent-test', 'compact');
    assert.equal(sessionState.loadState('agent-test').allowParallel, true);
    hookHandlers.handleSessionStart('agent-test', 'resume');
    assert.equal(sessionState.loadState('agent-test').allowParallel, true);

    hookHandlers.handleSessionStart('agent-test', 'startup');
    assert.equal(sessionState.loadState('agent-test').allowParallel, false);
  });

  it('stop reminder fires once per prompt and again after the next prompt', () => {
    const firstStop = hookHandlers.handleStop('agent-test');
    assert.ok(firstStop.context);
    assert.match(firstStop.context, /plain language/i);
    assert.match(firstStop.context, /format/i);
    assert.match(firstStop.context, /entrypoint|architecture obvious/i);
    assert.match(firstStop.context, /edges you own|non-trivial/i);
    assert.match(firstStop.context, /tool result/i);
    const secondStop = hookHandlers.handleStop('agent-test');
    assert.equal(secondStop.context, null);

    hookHandlers.handleUserPrompt('agent-test', 'next task please', 'p2');
    const stopAfterNewPrompt = hookHandlers.handleStop('agent-test');
    assert.ok(stopAfterNewPrompt.context);
  });

  it('duplicate session-start firing stays silent and keeps state', () => {
    const firstStart = hookHandlers.handleSessionStart('dup-test', 'startup');
    assert.ok(firstStart.context);
    hookHandlers.handleUserPrompt('dup-test', 'use subagents please', 'p1');
    assert.equal(sessionState.loadState('dup-test').allowParallel, true);

    const duplicateStart = hookHandlers.handleSessionStart('dup-test', 'startup');
    assert.equal(duplicateStart.context, null);
    assert.equal(sessionState.loadState('dup-test').allowParallel, true);
  });

  it('duplicate user-prompt firing returns no context', () => {
    const firstFiring = hookHandlers.handleUserPrompt('agent-test', 'fix the bug', 'p1');
    assert.ok(firstFiring.context);
    const duplicateFiring = hookHandlers.handleUserPrompt('agent-test', 'fix the bug', 'p1');
    assert.equal(duplicateFiring.context, null);
  });

  it('duplicate agent firing with the same tool call id consumes one slot', () => {
    const firstFiring = hookHandlers.handlePreAgent('agent-test', 'toolu_a');
    assert.equal(firstFiring.allowed, true);
    const duplicateFiring = hookHandlers.handlePreAgent('agent-test', 'toolu_a');
    assert.equal(duplicateFiring.allowed, true);

    // Budget is 1 in this suite, so a genuinely new call is denied.
    const newCall = hookHandlers.handlePreAgent('agent-test', 'toolu_b');
    assert.equal(newCall.allowed, false);
  });

  it('search warn returns after a new prompt resets the read count', () => {
    hookHandlers.handleTrackRead('agent-test');
    const missing = path.join(STATE_DIR, 'another-new-file.js');
    const beforeNewPrompt = hookHandlers.handlePreWrite('agent-test', 'Write', missing);
    assert.equal(beforeNewPrompt.context, null);

    hookHandlers.handleUserPrompt('agent-test', 'write the new module', 'p2');
    const afterNewPrompt = hookHandlers.handlePreWrite('agent-test', 'Write', missing);
    assert.ok(afterNewPrompt.context);
  });

  it('respects CLAUDE_FORM_DISABLED', () => {
    process.env.CLAUDE_FORM_DISABLED = '1';
    delete require.cache[require.resolve('../shared/session-state')];
    delete require.cache[require.resolve('../shared/handlers')];
    hookHandlers = require('../shared/handlers');
    // consume would have denied on 2nd; disabled always allows
    hookHandlers.handleSessionStart('disabled');
    assert.equal(hookHandlers.handlePreAgent('disabled').allowed, true);
    assert.equal(hookHandlers.handlePreAgent('disabled').allowed, true);
  });
});
