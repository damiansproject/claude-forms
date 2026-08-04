'use strict';

const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const os = require('os');
const path = require('path');

const STATE_DIR = path.join(os.tmpdir(), `claude-forms-test-${process.pid}`);

describe('session-state', () => {
  let mod;

  beforeEach(() => {
    process.env.CLAUDE_FORM_STATE_DIR = STATE_DIR;
    process.env.CLAUDE_FORM_AGENT_BUDGET = '1';
    process.env.CLAUDE_FORM_PARALLEL_BUDGET = '8';
    delete process.env.CLAUDE_FORM_ALLOW_PARALLEL;
    delete process.env.CLAUDE_FORM_DISABLED;
    fs.rmSync(STATE_DIR, { recursive: true, force: true });
    delete require.cache[require.resolve('../shared/session-state')];
    mod = require('../shared/session-state');
  });

  afterEach(() => {
    fs.rmSync(STATE_DIR, { recursive: true, force: true });
  });

  it('resets session to defaults', () => {
    const s = mod.resetSession('s1');
    assert.equal(s.readCount, 0);
    assert.equal(s.promptAgentCount, 0);
    assert.equal(s.allowParallel, false);
  });

  it('bumps read count', () => {
    mod.resetSession('s1');
    mod.bumpRead('s1');
    mod.bumpRead('s1');
    assert.equal(mod.loadState('s1').readCount, 2);
  });

  it('persists allowParallel after opt-in prompt', () => {
    mod.resetSession('s1');
    mod.onUserPrompt('s1', { promptId: 'p1', allowParallel: true });
    assert.equal(mod.loadState('s1').allowParallel, true);
    mod.onUserPrompt('s1', { promptId: 'p2', allowParallel: false });
    assert.equal(mod.loadState('s1').allowParallel, true);
  });

  it('resets promptAgentCount on new prompt id', () => {
    mod.resetSession('s1');
    const a = mod.tryConsumeAgent('s1');
    assert.equal(a.allowed, true);
    assert.equal(mod.loadState('s1').promptAgentCount, 1);
    mod.onUserPrompt('s1', { promptId: 'next' });
    assert.equal(mod.loadState('s1').promptAgentCount, 0);
  });
});
