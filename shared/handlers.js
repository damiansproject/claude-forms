'use strict';

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
  searchFirstWarning,
  stopGroundingReminder,
} = require('./policy');

// Don't reset state on compact/resume/fork (Claude Code SessionStart `source`).
const PRESERVE_STATE_SOURCES = new Set(['resume', 'compact', 'fork']);

function handleSessionStart(sessionId, source) {
  if (isDisabled()) return { context: null };
  if (!PRESERVE_STATE_SOURCES.has(source)) resetSession(sessionId);
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
    '[claude-forms] Stay in scope. Search before inventing. Match the nearest live sibling; if the draft would exceed it, stop and ask before writing more. Prefer doing the work yourself unless the user asked for parallel agents.'
  );
  return { context: bits.join(' '), optedIn };
}

function handleTrackRead(sessionId) {
  if (isDisabled()) return;
  bumpRead(sessionId);
}

/**
 * Warn on new-file Write with zero searches; deny instead when
 * CLAUDE_FORM_STRICT_SEARCH=1. Never decides permission on the warn path.
 * @returns {{ context: string|null, deny: boolean }}
 */
function handlePreWrite(sessionId, toolName, filePath) {
  if (isDisabled()) return { context: null, deny: false };
  const state = loadState(sessionId);
  const isWrite = String(toolName || '').toLowerCase().includes('write');
  if (!isWrite) return { context: null, deny: false };
  if (state.readCount > 0) return { context: null, deny: false };
  if (filePath && fs.existsSync(filePath)) return { context: null, deny: false };
  const strict = process.env.CLAUDE_FORM_STRICT_SEARCH === '1';
  return { context: searchFirstWarning(filePath, strict), deny: strict };
}

/**
 * Hard cap Agent/Task/Workflow spawning.
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

/** Grounding reminder, shown once per session. */
function handleStop(sessionId) {
  if (isDisabled()) return { context: null };
  const state = loadState(sessionId);
  if (state.stopReminded) return { context: null };
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
