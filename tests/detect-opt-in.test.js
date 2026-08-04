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
    assert.equal(detectOptIn('delegate the research'), true);
    assert.equal(detectOptIn('go do it end to end'), true);
    assert.equal(detectOptIn('work autonomous on this'), true);
    assert.equal(detectOptIn('Use Agents to explore'), true);
  });
});
