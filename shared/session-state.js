'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');

const STATE_DIR = process.env.CLAUDE_FORM_STATE_DIR || path.join(os.tmpdir(), 'claude-forms');
const DEFAULT_BUDGET = Number(process.env.CLAUDE_FORM_AGENT_BUDGET || 1);
const PARALLEL_BUDGET = Number(process.env.CLAUDE_FORM_PARALLEL_BUDGET || 8);

/**
 * @param {string} sessionId
 * @returns {string}
 */
function statePath(sessionId) {
  const safe = String(sessionId || 'default').replace(/[^a-zA-Z0-9._-]/g, '_');
  return path.join(STATE_DIR, `${safe}.json`);
}

/**
 * @returns {{ allowParallel: boolean, readCount: number, agentCount: number, promptAgentCount: number, lastPromptId: string|null, stopReminded: boolean }}
 */
function defaultState() {
  return {
    allowParallel: process.env.CLAUDE_FORM_ALLOW_PARALLEL === '1',
    readCount: 0,
    agentCount: 0,
    promptAgentCount: 0,
    lastPromptId: null,
    stopReminded: false,
  };
}

/**
 * @param {string} sessionId
 */
function loadState(sessionId) {
  try {
    const raw = fs.readFileSync(statePath(sessionId), 'utf8');
    return { ...defaultState(), ...JSON.parse(raw) };
  } catch {
    return defaultState();
  }
}

/**
 * @param {string} sessionId
 * @param {object} state
 */
function saveState(sessionId, state) {
  fs.mkdirSync(STATE_DIR, { recursive: true });
  fs.writeFileSync(statePath(sessionId), JSON.stringify(state, null, 2));
}

/**
 * Reset session counters (SessionStart / clear).
 * @param {string} sessionId
 */
function resetSession(sessionId) {
  const state = defaultState();
  saveState(sessionId, state);
  return state;
}

/**
 * @param {string} sessionId
 * @param {boolean} allow
 */
function setAllowParallel(sessionId, allow) {
  const state = loadState(sessionId);
  if (allow) state.allowParallel = true;
  saveState(sessionId, state);
  return state;
}

/**
 * New user prompt: reset per-prompt agent counter; optionally set parallel opt-in.
 * @param {string} sessionId
 * @param {{ promptId?: string, allowParallel?: boolean }} opts
 */
function onUserPrompt(sessionId, opts = {}) {
  const state = loadState(sessionId);
  if (opts.allowParallel) state.allowParallel = true;
  if (opts.promptId && opts.promptId !== state.lastPromptId) {
    state.lastPromptId = opts.promptId;
    state.promptAgentCount = 0;
  } else if (!opts.promptId) {
    state.promptAgentCount = 0;
  }
  saveState(sessionId, state);
  return state;
}

/**
 * @param {string} sessionId
 */
function bumpRead(sessionId) {
  const state = loadState(sessionId);
  state.readCount += 1;
  saveState(sessionId, state);
  return state;
}

/**
 * @param {string} sessionId
 * @returns {number}
 */
function agentBudget(sessionId) {
  const state = loadState(sessionId);
  if (state.allowParallel) return PARALLEL_BUDGET;
  return Number.isFinite(DEFAULT_BUDGET) ? DEFAULT_BUDGET : 1;
}

/**
 * Decide whether an Agent/Task spawn is allowed. Increments counter on allow.
 * @param {string} sessionId
 * @returns {{ allowed: boolean, reason: string, state: object, budget: number, warnNearLimit: boolean }}
 */
function tryConsumeAgent(sessionId) {
  const state = loadState(sessionId);
  const budget = agentBudget(sessionId);
  const used = state.promptAgentCount;

  if (used >= budget) {
    return {
      allowed: false,
      reason:
        `Agent budget exhausted (${used}/${budget}). Do the work yourself, or ask the user to opt into parallel agents (e.g. "use subagents", "in parallel", "allow parallel agents").`,
      state,
      budget,
      warnNearLimit: false,
    };
  }

  state.promptAgentCount += 1;
  state.agentCount += 1;
  saveState(sessionId, state);

  const warnNearLimit = !state.allowParallel && state.promptAgentCount >= budget;
  return {
    allowed: true,
    reason: warnNearLimit
      ? `Using last agent slot this turn (${state.promptAgentCount}/${budget}). Prefer finishing yourself unless the user opted into parallel work.`
      : '',
    state,
    budget,
    warnNearLimit,
  };
}

function isDisabled() {
  return process.env.CLAUDE_FORM_DISABLED === '1';
}

module.exports = {
  STATE_DIR,
  DEFAULT_BUDGET,
  PARALLEL_BUDGET,
  statePath,
  defaultState,
  loadState,
  saveState,
  resetSession,
  setAllowParallel,
  onUserPrompt,
  bumpRead,
  agentBudget,
  tryConsumeAgent,
  isDisabled,
};
