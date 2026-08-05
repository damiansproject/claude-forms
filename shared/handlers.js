'use strict';

// Platform-neutral behavior used by the Claude Code and Cursor hook entrypoints.
const fs = require('fs');
const { detectOptIn } = require('./detect-opt-in');
const {
  DUPLICATE_WINDOW_MS,
  isDisabled,
  resetSession,
  onUserPrompt,
  bumpRead,
  loadState,
  saveState,
  tryConsumeAgent,
} = require('./session-state');
const {
  policySummary,
  userPromptReminder,
  searchFirstWarning,
  stopGroundingReminder,
} = require('./policy');

// Don't reset state on compact/resume/fork (Claude Code SessionStart `source`).
const PRESERVE_STATE_SOURCES = new Set(['resume', 'compact', 'fork']);

function handleSessionStart(sessionId, source) {
  if (isDisabled()) {
    return { context: null };
  }
  const state = loadState(sessionId);
  const now = Date.now();

  // A second hook copy firing for the same start event (project drop-in plus
  // user-level install): stay silent and leave state alone.
  const sameSource = (source || null) === (state.lastSessionStartSource || null);
  if (sameSource && now - state.lastSessionStartAt < DUPLICATE_WINDOW_MS) {
    return { context: null };
  }

  let nextState = state;
  if (!PRESERVE_STATE_SOURCES.has(source)) {
    nextState = resetSession(sessionId);
  }
  nextState.lastSessionStartAt = now;
  nextState.lastSessionStartSource = source || null;
  saveState(sessionId, nextState);
  return { context: policySummary() };
}

function handleUserPrompt(sessionId, prompt, promptId) {
  if (isDisabled()) {
    return { context: null, optedIn: false, duplicate: false };
  }
  const optedIn = detectOptIn(prompt || '');
  const { duplicate } = onUserPrompt(sessionId, { promptId, prompt, allowParallel: optedIn });
  if (duplicate) {
    return { context: null, optedIn, duplicate };
  }
  const messageParts = [];
  if (optedIn) {
    messageParts.push(
      '[claude-forms] Parallel agents enabled for this session (user opt-in detected).',
    );
  }
  messageParts.push(userPromptReminder());
  return { context: messageParts.join(' '), optedIn, duplicate };
}

function handleTrackRead(sessionId) {
  if (isDisabled()) {
    return;
  }
  bumpRead(sessionId);
}

function handlePreWrite(sessionId, toolName, filePath) {
  if (isDisabled()) {
    return { context: null, deny: false };
  }
  const state = loadState(sessionId);
  const toolNameText = String(toolName || '').toLowerCase();
  const isWrite = toolNameText.includes('write');
  if (!isWrite) {
    return { context: null, deny: false };
  }
  if (state.readCount > 0) {
    return { context: null, deny: false };
  }
  if (filePath && fs.existsSync(filePath)) {
    return { context: null, deny: false };
  }
  const strict = process.env.CLAUDE_FORM_STRICT_SEARCH === '1';
  const context = searchFirstWarning(filePath, strict);
  return { context, deny: strict };
}

function handlePreAgent(sessionId, toolUseId) {
  if (isDisabled()) {
    return { allowed: true, reason: '', warn: '' };
  }
  return tryConsumeAgent(sessionId, toolUseId);
}

function handleStop(sessionId) {
  if (isDisabled()) {
    return { context: null };
  }
  const state = loadState(sessionId);
  if (state.stopReminded) {
    return { context: null };
  }
  state.stopReminded = true;
  saveState(sessionId, state);
  return { context: stopGroundingReminder() };
}

module.exports = {
  handleSessionStart,
  handleUserPrompt,
  handleTrackRead,
  handlePreWrite,
  handlePreAgent,
  handleStop,
};
