'use strict';

/**
 * Detect whether the user explicitly opted into parallel / subagent work.
 */

const OPT_IN_PATTERNS = [
  /\ballow\s+parallel\s+agents?\b/i,
  /\bin\s+parallel\b/i,
  /\bparallel\b/i,
  /\bsub-?agents?\b/i,
  /\bdelegate\b/i,
  /\bfan\s*out\b/i,
  /\buse\s+agents?\b/i,
  /\bgo\s+do\b/i,
  /\bend\s+to\s+end\b/i,
  /\bautonomous\b/i,
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
