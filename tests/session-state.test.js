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

  it('new prompt resets read count and stop reminder', () => {
    sessionState.resetSession('session-one');
    sessionState.bumpRead('session-one');
    const state = sessionState.loadState('session-one');
    state.stopReminded = true;
    sessionState.saveState('session-one', state);

    sessionState.onUserPrompt('session-one', { promptId: 'next-prompt', prompt: 'next task' });
    const afterPrompt = sessionState.loadState('session-one');
    assert.equal(afterPrompt.readCount, 0);
    assert.equal(afterPrompt.stopReminded, false);
  });

  it('second firing with the same prompt id is a duplicate and keeps counters', () => {
    sessionState.resetSession('session-one');
    const firstFiring = sessionState.onUserPrompt('session-one', {
      promptId: 'prompt-one',
      prompt: 'fix the bug',
    });
    assert.equal(firstFiring.duplicate, false);

    sessionState.tryConsumeAgent('session-one');
    const secondFiring = sessionState.onUserPrompt('session-one', {
      promptId: 'prompt-one',
      prompt: 'fix the bug',
    });
    assert.equal(secondFiring.duplicate, true);
    assert.equal(sessionState.loadState('session-one').promptAgentCount, 1);
  });

  it('with no prompt id, same prompt text right away is a duplicate; new text is not', () => {
    sessionState.resetSession('session-one');
    const firstFiring = sessionState.onUserPrompt('session-one', { prompt: 'fix the bug' });
    assert.equal(firstFiring.duplicate, false);

    const secondFiring = sessionState.onUserPrompt('session-one', { prompt: 'fix the bug' });
    assert.equal(secondFiring.duplicate, true);

    const differentPrompt = sessionState.onUserPrompt('session-one', {
      prompt: 'now update the readme',
    });
    assert.equal(differentPrompt.duplicate, false);
  });

  it('same agent tool call id consumes one slot across duplicate firings', () => {
    sessionState.resetSession('session-one');
    const firstFiring = sessionState.tryConsumeAgent('session-one', 'toolu_1');
    assert.equal(firstFiring.allowed, true);

    const duplicateFiring = sessionState.tryConsumeAgent('session-one', 'toolu_1');
    assert.equal(duplicateFiring.allowed, true);
    assert.equal(duplicateFiring.warn, '');
    assert.equal(sessionState.loadState('session-one').promptAgentCount, 1);

    // Budget is 1 in this suite, so a genuinely new call is denied.
    const newCall = sessionState.tryConsumeAgent('session-one', 'toolu_2');
    assert.equal(newCall.allowed, false);
  });
});
