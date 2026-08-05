'use strict';

// Persistent per-session counters, duplicate-firing detection, and agent-budget decisions.
const fs = require('fs');
const os = require('os');
const path = require('path');

const STATE_DIR = process.env.CLAUDE_FORM_STATE_DIR || path.join(os.tmpdir(), 'claude-forms');

function parseBudget(raw, fallback) {
  const n = Number(raw);
  if (Number.isFinite(n) && n >= 1) {
    return n;
  }
  return fallback;
}

const DEFAULT_BUDGET = parseBudget(process.env.CLAUDE_FORM_AGENT_BUDGET, 1);
const PARALLEL_BUDGET = parseBudget(process.env.CLAUDE_FORM_PARALLEL_BUDGET, 8);

// A project drop-in and the user-level install can both fire hooks for the same
// event. Firings this close together with the same identity count as one event.
const DUPLICATE_WINDOW_MS = 10000;

function statePath(sessionId) {
  // Keep state filenames portable: only letters, numbers, dot, underscore, hyphen.
  const safe = String(sessionId || 'default').replace(/[^a-zA-Z0-9._-]/g, '_');
  return path.join(STATE_DIR, `${safe}.json`);
}

function defaultState() {
  return {
    allowParallel: process.env.CLAUDE_FORM_ALLOW_PARALLEL === '1',
    readCount: 0,
    promptAgentCount: 0,
    lastPromptId: null,
    lastPromptText: '',
    lastPromptAt: 0,
    lastSessionStartAt: 0,
    lastSessionStartSource: null,
    lastAgentToolUseId: null,
    stopReminded: false,
  };
}

function loadState(sessionId) {
  const state = defaultState();
  try {
    const raw = fs.readFileSync(statePath(sessionId), 'utf8');
    const saved = JSON.parse(raw);
    if (typeof saved.allowParallel === 'boolean') {
      state.allowParallel = saved.allowParallel;
    }
    if (typeof saved.readCount === 'number') {
      state.readCount = saved.readCount;
    }
    if (typeof saved.promptAgentCount === 'number') {
      state.promptAgentCount = saved.promptAgentCount;
    }
    if (saved.lastPromptId !== undefined) {
      state.lastPromptId = saved.lastPromptId;
    }
    if (typeof saved.lastPromptText === 'string') {
      state.lastPromptText = saved.lastPromptText;
    }
    if (typeof saved.lastPromptAt === 'number') {
      state.lastPromptAt = saved.lastPromptAt;
    }
    if (typeof saved.lastSessionStartAt === 'number') {
      state.lastSessionStartAt = saved.lastSessionStartAt;
    }
    if (saved.lastSessionStartSource !== undefined) {
      state.lastSessionStartSource = saved.lastSessionStartSource;
    }
    if (saved.lastAgentToolUseId !== undefined) {
      state.lastAgentToolUseId = saved.lastAgentToolUseId;
    }
    if (typeof saved.stopReminded === 'boolean') {
      state.stopReminded = saved.stopReminded;
    }
  } catch {
    // Missing or invalid file: keep defaults.
  }
  return state;
}

function saveState(sessionId, state) {
  fs.mkdirSync(STATE_DIR, { recursive: true });
  fs.writeFileSync(statePath(sessionId), JSON.stringify(state, null, 2));
}

function resetSession(sessionId) {
  const state = defaultState();
  saveState(sessionId, state);
  return state;
}

function onUserPrompt(sessionId, opts = {}) {
  const state = loadState(sessionId);
  const now = Date.now();

  // Only a 200-char prefix is stored and compared so huge pasted prompts do not
  // bloat the state file.
  const promptPrefix = typeof opts.prompt === 'string' ? opts.prompt.slice(0, 200) : '';

  // Duplicate = a second hook copy firing for the same submission: same prompt
  // id, or same prompt text within the duplicate window when there is no id.
  let duplicate = false;
  if (opts.promptId) {
    duplicate = opts.promptId === state.lastPromptId;
  } else if (promptPrefix !== '') {
    duplicate =
      promptPrefix === state.lastPromptText && now - state.lastPromptAt < DUPLICATE_WINDOW_MS;
  }

  if (opts.allowParallel) {
    state.allowParallel = true;
  }

  if (!duplicate) {
    state.lastPromptId = opts.promptId || null;
    state.lastPromptText = promptPrefix;
    state.lastPromptAt = now;
    // The agent budget, search-before-write requirement, and stop reminder all
    // apply per user prompt.
    state.promptAgentCount = 0;
    state.readCount = 0;
    state.stopReminded = false;
  }

  saveState(sessionId, state);
  return { state, duplicate };
}

function bumpRead(sessionId) {
  const state = loadState(sessionId);
  state.readCount += 1;
  saveState(sessionId, state);
  return state;
}

function tryConsumeAgent(sessionId, toolUseId) {
  const state = loadState(sessionId);

  // A second hook copy firing for a tool call whose slot is already consumed:
  // allow silently instead of double-counting (or denying) the same call.
  if (toolUseId && toolUseId === state.lastAgentToolUseId) {
    return { allowed: true, reason: '', warn: '' };
  }

  let budget = DEFAULT_BUDGET;
  if (state.allowParallel) {
    budget = PARALLEL_BUDGET;
  }
  const used = state.promptAgentCount;

  if (used >= budget) {
    return {
      allowed: false,
      reason: `Agent budget exhausted (${used}/${budget}). Do the work yourself, or ask the user to opt into parallel agents (e.g. "use subagents", "in parallel", "allow parallel agents").`,
      warn: '',
    };
  }

  state.promptAgentCount += 1;
  if (toolUseId) {
    state.lastAgentToolUseId = toolUseId;
  }
  saveState(sessionId, state);

  let warn = '';
  if (!state.allowParallel && state.promptAgentCount >= budget) {
    warn = `Using last agent slot this turn (${state.promptAgentCount}/${budget}). Prefer finishing yourself unless the user opted into parallel work.`;
  }
  return {
    allowed: true,
    reason: '',
    warn,
  };
}

function isDisabled() {
  return process.env.CLAUDE_FORM_DISABLED === '1';
}

module.exports = {
  DUPLICATE_WINDOW_MS,
  loadState,
  saveState,
  resetSession,
  onUserPrompt,
  bumpRead,
  tryConsumeAgent,
  isDisabled,
};
