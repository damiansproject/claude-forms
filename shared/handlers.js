'use strict';

// Platform-neutral behavior used by the Claude Code and Cursor hook entrypoints.
const fs = require('fs');
const { detectOptIn } = require('./detect-opt-in');
const {
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
  if (!PRESERVE_STATE_SOURCES.has(source)) {
    resetSession(sessionId);
  }
  return { context: policySummary() };
}

function handleUserPrompt(sessionId, prompt, promptId) {
  if (isDisabled()) {
    return { context: null, optedIn: false };
  }
  const optedIn = detectOptIn(prompt || '');
  onUserPrompt(sessionId, { promptId, allowParallel: optedIn });
  const messageParts = [];
  if (optedIn) {
    messageParts.push(
      '[claude-forms] Parallel agents enabled for this session (user opt-in detected).',
    );
  }
  messageParts.push(userPromptReminder());
  return { context: messageParts.join(' '), optedIn };
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

function handlePreAgent(sessionId) {
  if (isDisabled()) {
    return { allowed: true, reason: '', warn: '' };
  }
  return tryConsumeAgent(sessionId);
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
