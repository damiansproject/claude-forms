'use strict';

/**
 * Detect whether the user explicitly opted into parallel / subagent work.
 */

// Agent/parallel phrases only — bare "parallel", "delegate", etc. false-positive on normal asks.
const OPT_IN_PATTERNS = [
  /\bparallel\s+agents?\b/i,
  /\bagents?\s+in\s+parallel\b/i,
  /\bin\s+parallel\b/i,
  /\bsub-?agents?\b/i,
  /\buse\s+(?:\w+\s+)?agents?\b/i,
  /\bspawn\s+(?:\w+\s+)?agents?\b/i,
  /\b(?:multiple|many|several)\s+agents?\b/i,
  /\bfan\s*-?\s*out\b/i,
  /\bdelegate\s+(?:this|that|it|everything)\b/i,
  /\bautonomously\b/i,
  /\bgo\s+do\b/i,
];

/**
 * @param {string} text
 * @returns {boolean}
 */
function detectOptIn(text) {
  if (!text || typeof text !== 'string') return false;
  return OPT_IN_PATTERNS.some((re) => re.test(text));
}

module.exports = {
  detectOptIn,
  OPT_IN_PATTERNS,
};
