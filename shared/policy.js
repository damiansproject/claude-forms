'use strict';

/** Short injection for SessionStart / reminders (keep token cost low). */
function policySummary() {
  return [
    '[claude-forms] Scope tightly: deliver only what was asked. No drive-by refactors, helpers, or speculative abstractions.',
    'Search the repo (Grep/Glob/Read) before creating new files or utilities; extend existing code when it fits.',
    'When extending a pattern, match the nearest live sibling. If the draft would exceed it in modes, schema, or layers, stop and ask — do not write the fat file first.',
    'Readable code over fortress code; robustness/security only when requested. Prefer rewrite over patch stacks. Minimal files ≠ done: honest types (no cast stacks), handle edges you own, test non-trivial branching, keep long prose out of hot paths; delete one-offs; keep docs true; run the repo formatter if one exists.',
    'Claim only work you can evidence with tool results from this session.',
    'Default: do the work yourself. Extra agents only for large independent parallel tracks or when the user opts in.',
    'Do not add verify/double-check/subagent-review scaffolding for your own work.',
  ].join(' ');
}

/** Per-prompt soft reminder (UserPromptSubmit / beforeSubmitPrompt). */
function userPromptReminder() {
  return (
    '[claude-forms] Stay in scope. Search before inventing. Match the nearest live sibling; ' +
    'if the draft would exceed it, stop and ask before writing more. Prefer doing the work yourself ' +
    'unless the user asked for parallel agents. Readable over fortress; robustness on request; ' +
    'minimal architecture still needs correct edges, honest types, and tests for non-trivial logic.'
  );
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
    'If something is unverified, say so. Do not expand scope beyond what was asked. ' +
    'Before finishing: exercise edges you own (empty/invalid inputs), avoid type cast stacks, run or add focused tests for non-trivial branching, ' +
    'delete one-off scripts you created, update docs your change made wrong, and run the repo formatter on touched files if one exists. ' +
    'Final user message: plain language for a reader who saw none of the work — no working abbreviations, arrow chains, or labels you invented mid-run.'
  );
}

module.exports = {
  policySummary,
  userPromptReminder,
  searchFirstWarning,
  stopGroundingReminder,
};
