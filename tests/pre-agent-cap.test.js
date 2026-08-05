'use strict';

const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');

const STATE_DIR = path.join(os.tmpdir(), `claude-forms-agent-test-${process.pid}`);

describe('pre-agent budget', () => {
  let handlers;
  let state;

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
    state = require('../shared/session-state');
    handlers = require('../shared/handlers');
    handlers.handleSessionStart('agent-test');
  });

  afterEach(() => {
    fs.rmSync(STATE_DIR, { recursive: true, force: true });
  });

  it('allows first agent then denies second without opt-in', () => {
    const first = handlers.handlePreAgent('agent-test');
    assert.equal(first.allowed, true);
    const second = handlers.handlePreAgent('agent-test');
    assert.equal(second.allowed, false);
    assert.match(second.reason, /budget exhausted/i);
  });

  it('allows more agents after opt-in', () => {
    handlers.handleUserPrompt('agent-test', 'please use subagents in parallel', 'p1');
    const results = [];
    for (let i = 0; i < 3; i++) {
      results.push(handlers.handlePreAgent('agent-test'));
    }
    assert.ok(results.every((r) => r.allowed));
  });

  it('warns when consuming the last default slot', () => {
    const first = handlers.handlePreAgent('agent-test');
    assert.equal(first.allowed, true);
    assert.ok(first.warn);
  });

  it('search warn only for new Write with zero reads', () => {
    const missing = path.join(STATE_DIR, 'brand-new-file.js');
    const w = handlers.handlePreWrite('agent-test', 'Write', missing);
    assert.ok(w.context);
    assert.match(w.context, /Search the repo/i);
    assert.equal(w.deny, false);

    handlers.handleTrackRead('agent-test');
    const after = handlers.handlePreWrite('agent-test', 'Write', missing);
    assert.equal(after.context, null);

    // Edit never warns even at zero reads — reset and check
    handlers.handleSessionStart('edit-test');
    const editWarn = handlers.handlePreWrite('edit-test', 'Edit', missing);
    assert.equal(editWarn.context, null);
  });

  it('strict mode denies new Write with zero reads', () => {
    process.env.CLAUDE_FORM_STRICT_SEARCH = '1';
    const missing = path.join(STATE_DIR, 'brand-new-file.js');
    const w = handlers.handlePreWrite('agent-test', 'Write', missing);
    assert.equal(w.deny, true);
    assert.match(w.context, /Blocked/i);

    handlers.handleTrackRead('agent-test');
    const after = handlers.handlePreWrite('agent-test', 'Write', missing);
    assert.equal(after.deny, false);
    assert.equal(after.context, null);
  });

  it('preserves opt-in across compact/resume, resets on startup', () => {
    handlers.handleUserPrompt('agent-test', 'use subagents please', 'p1');
    assert.equal(state.loadState('agent-test').allowParallel, true);

    handlers.handleSessionStart('agent-test', 'compact');
    assert.equal(state.loadState('agent-test').allowParallel, true);
    handlers.handleSessionStart('agent-test', 'resume');
    assert.equal(state.loadState('agent-test').allowParallel, true);

    handlers.handleSessionStart('agent-test', 'startup');
    assert.equal(state.loadState('agent-test').allowParallel, false);
  });

  it('stop reminder fires once per session', () => {
    const first = handlers.handleStop('agent-test');
    assert.ok(first.context);
    const second = handlers.handleStop('agent-test');
    assert.equal(second.context, null);
  });

  it('respects CLAUDE_FORM_DISABLED', () => {
    process.env.CLAUDE_FORM_DISABLED = '1';
    delete require.cache[require.resolve('../shared/session-state')];
    delete require.cache[require.resolve('../shared/handlers')];
    handlers = require('../shared/handlers');
    // consume would have denied on 2nd; disabled always allows
    handlers.handleSessionStart('disabled');
    assert.equal(handlers.handlePreAgent('disabled').allowed, true);
    assert.equal(handlers.handlePreAgent('disabled').allowed, true);
  });
});
