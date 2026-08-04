'use strict';

const fs = require('fs');
const { detectOptIn } = require('./detect-opt-in');
const {
  isDisabled,
  resetSession,
  onUserPrompt,
  bumpRead,
  loadState,
  tryConsumeAgent,
} = require('./session-state');
const {
  policySummary,
  searchFirstWarning,
  stopGroundingReminder,
} = require('./policy');

function handleSessionStart(sessionId) {
  if (isDisabled()) return { context: null };
  resetSession(sessionId);
  return { context: policySummary() };
}

function handleUserPrompt(sessionId, prompt, promptId) {
  if (isDisabled()) return { context: null, optedIn: false };
  const optedIn = detectOptIn(prompt || '');
  onUserPrompt(sessionId, { promptId, allowParallel: optedIn });
  const bits = [];
  if (optedIn) {
    bits.push('[claude-forms] Parallel agents enabled for this session (user opt-in detected).');
  }
  bits.push(
    '[claude-forms] Stay in scope. Search before inventing. Prefer doing the work yourself unless the user asked for parallel agents.'
  );
  return { context: bits.join(' '), optedIn };
}

function handleTrackRead(sessionId) {
  if (isDisabled()) return;
  bumpRead(sessionId);
}

/**
 * Soft warn only — never blocks Write/Edit.
 * @returns {{ context: string|null }}
 */
function handlePreWrite(sessionId, toolName, filePath) {
  if (isDisabled()) return { context: null };
  const state = loadState(sessionId);
  const isWrite = String(toolName || '').toLowerCase().includes('write');
  if (!isWrite) return { context: null };
  if (state.readCount > 0) return { context: null };
  if (filePath && fs.existsSync(filePath)) return { context: null };
  return { context: searchFirstWarning(filePath) };
}

/**
 * Hard cap Agent/Task spawning.
 * @returns {{ allowed: boolean, reason: string, warn: string }}
 */
function handlePreAgent(sessionId) {
  if (isDisabled()) return { allowed: true, reason: '', warn: '' };
  const result = tryConsumeAgent(sessionId);
  return {
    allowed: result.allowed,
    reason: result.reason,
    warn: result.warnNearLimit ? result.reason : '',
  };
}

function handleStop() {
  if (isDisabled()) return { context: null };
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
