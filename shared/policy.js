'use strict';

const fs = require('fs');
const path = require('path');

const POLICY_PATH = path.join(__dirname, 'policy.md');

function readPolicy() {
  try {
    return fs.readFileSync(POLICY_PATH, 'utf8').trim();
  } catch {
    return '';
  }
}

/** Short injection for SessionStart / reminders (keep token cost low). */
function policySummary() {
  return [
    '[claude-forms] Scope tightly: deliver only what was asked. No drive-by refactors, helpers, or speculative abstractions.',
    'Search the repo (Grep/Glob/Read) before creating new files or utilities; extend existing code when it fits.',
    'When extending a pattern, match the nearest live sibling. If the draft would exceed it in modes, schema, or layers, stop and ask — do not write the fat file first.',
    'Claim only work you can evidence with tool results from this session.',
    'Default: do the work yourself. Extra agents only for large independent parallel tracks or when the user opts in.',
    'Do not add verify/double-check/subagent-review scaffolding for your own work.',
  ].join(' ');
}

function searchFirstWarning(filePath, strict) {
  if (strict) {
    return (
      `[claude-forms] Blocked: new file ${filePath || '(unknown)'} with zero Read/Grep/Glob in this session (strict mode). ` +
      'Search the repo for existing implementations first (Grep/Glob/Read), then retry.'
    );
  }
  return (
    `[claude-forms] About to write new file ${filePath || '(unknown)'} without any Read/Grep/Glob in this session. ` +
    'Search the repo for existing implementations and conventions first; extend in place when possible.'
  );
}

function stopGroundingReminder() {
  return (
    '[claude-forms] Lead with the outcome. Before claiming progress, audit each claim against a tool result from this session. ' +
    'If something is unverified, say so. Do not expand scope beyond what was asked.'
  );
}

module.exports = {
  POLICY_PATH,
  readPolicy,
  policySummary,
  searchFirstWarning,
  stopGroundingReminder,
};
