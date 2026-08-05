'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const { detectOptIn } = require('../shared/detect-opt-in');

describe('detectOptIn', () => {
  it('returns false for empty / normal coding asks', () => {
    assert.equal(detectOptIn(''), false);
    assert.equal(detectOptIn(null), false);
    assert.equal(detectOptIn('fix the login bug'), false);
    assert.equal(detectOptIn('add a button to the form'), false);
  });

  it('detects explicit parallel / agent phrases', () => {
    assert.equal(detectOptIn('please use subagents for this'), true);
    assert.equal(detectOptIn('run these in parallel'), true);
    assert.equal(detectOptIn('allow parallel agents'), true);
    assert.equal(detectOptIn('fan out the investigation'), true);
    assert.equal(detectOptIn('delegate this to another agent'), true);
    assert.equal(detectOptIn('go do it end to end'), true);
    assert.equal(detectOptIn('work autonomously on this'), true);
    assert.equal(detectOptIn('Use Agents to explore'), true);
    assert.equal(detectOptIn('use 3 agents to split the audit'), true);
    assert.equal(detectOptIn('spawn agents for each module'), true);
    assert.equal(detectOptIn('use multiple agents'), true);
  });

  it('ignores coding asks that merely contain ambiguous words', () => {
    assert.equal(detectOptIn('add an end to end test for login'), false);
    assert.equal(detectOptIn('parallelize the test suite'), false);
    assert.equal(detectOptIn('make the fetch calls parallel'), false);
    assert.equal(detectOptIn('implement the delegate pattern here'), false);
    assert.equal(detectOptIn('add a delegate to the view controller'), false);
    assert.equal(detectOptIn('fix the autonomous driving module'), false);
    assert.equal(detectOptIn('set the user agent header'), false);
    assert.equal(detectOptIn('the CI workflow is failing'), false);
  });
});
