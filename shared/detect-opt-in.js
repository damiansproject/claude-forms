'use strict';

/**
 * Detect whether the user explicitly opted into parallel / subagent work.
 * Bare words like "parallel" or "delegate" alone do not opt in.
 */

const OPT_IN_PATTERNS = [
  { label: '"parallel agents" or "parallel agent"', pattern: /\bparallel\s+agents?\b/i },
  { label: '"agents in parallel"', pattern: /\bagents?\s+in\s+parallel\b/i },
  { label: '"in parallel" (any parallel work)', pattern: /\bin\s+parallel\b/i },
  { label: '"subagent" or "sub-agent"', pattern: /\bsub-?agents?\b/i },
  { label: '"use … agents" (e.g. use 3 agents)', pattern: /\buse\s+(?:\w+\s+)?agents?\b/i },
  { label: '"spawn … agents"', pattern: /\bspawn\s+(?:\w+\s+)?agents?\b/i },
  { label: '"multiple/many/several agents"', pattern: /\b(?:multiple|many|several)\s+agents?\b/i },
  { label: '"fan out"', pattern: /\bfan\s*-?\s*out\b/i },
  {
    label: '"delegate this/that/it/everything"',
    pattern: /\bdelegate\s+(?:this|that|it|everything)\b/i,
  },
  { label: '"autonomously"', pattern: /\bautonomously\b/i },
  { label: '"go do" (autonomous pipeline)', pattern: /\bgo\s+do\b/i },
];

function detectOptIn(text) {
  if (!text || typeof text !== 'string') {
    return false;
  }
  for (const entry of OPT_IN_PATTERNS) {
    if (entry.pattern.test(text)) {
      return true;
    }
  }
  return false;
}

module.exports = {
  detectOptIn,
};
