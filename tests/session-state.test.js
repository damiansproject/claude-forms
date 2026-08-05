'use strict';

const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');

const STATE_DIR = path.join(os.tmpdir(), `claude-forms-test-${process.pid}`);

describe('session-state', () => {
  let sessionState;

  beforeEach(() => {
    process.env.CLAUDE_FORM_STATE_DIR = STATE_DIR;
    process.env.CLAUDE_FORM_AGENT_BUDGET = '1';
    process.env.CLAUDE_FORM_PARALLEL_BUDGET = '8';
    delete process.env.CLAUDE_FORM_ALLOW_PARALLEL;
    delete process.env.CLAUDE_FORM_DISABLED;
    fs.rmSync(STATE_DIR, { recursive: true, force: true });
    delete require.cache[require.resolve('../shared/session-state')];
    sessionState = require('../shared/session-state');
  });

  afterEach(() => {
    fs.rmSync(STATE_DIR, { recursive: true, force: true });
  });

  it('resets session to defaults', () => {
    const state = sessionState.resetSession('session-one');
    assert.equal(state.readCount, 0);
    assert.equal(state.promptAgentCount, 0);
    assert.equal(state.allowParallel, false);
  });

  it('bumps read count', () => {
    sessionState.resetSession('session-one');
    sessionState.bumpRead('session-one');
    sessionState.bumpRead('session-one');
    assert.equal(sessionState.loadState('session-one').readCount, 2);
  });

  it('persists allowParallel after opt-in prompt', () => {
    sessionState.resetSession('session-one');
    sessionState.onUserPrompt('session-one', { promptId: 'prompt-one', allowParallel: true });
    assert.equal(sessionState.loadState('session-one').allowParallel, true);
    sessionState.onUserPrompt('session-one', { promptId: 'prompt-two', allowParallel: false });
    assert.equal(sessionState.loadState('session-one').allowParallel, true);
  });

  it('resets promptAgentCount on new prompt id', () => {
    sessionState.resetSession('session-one');
    const agentResult = sessionState.tryConsumeAgent('session-one');
    assert.equal(agentResult.allowed, true);
    assert.equal(sessionState.loadState('session-one').promptAgentCount, 1);
    sessionState.onUserPrompt('session-one', { promptId: 'next-prompt' });
    assert.equal(sessionState.loadState('session-one').promptAgentCount, 0);
  });
});
