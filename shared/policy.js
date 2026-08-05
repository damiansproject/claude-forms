'use strict';

// Hook injection strings live in policy-inject.md (keep prose out of this module).
const fs = require('fs');
const path = require('path');

const INJECT_FILE = path.join(__dirname, 'policy-inject.md');

function readInjectSection(sectionName) {
  const fileText = fs.readFileSync(INJECT_FILE, 'utf8');
  const startMarker = `<!-- inject:${sectionName} -->`;
  const endMarker = `<!-- /inject:${sectionName} -->`;
  const startIndex = fileText.indexOf(startMarker);
  const endIndex = fileText.indexOf(endMarker);
  if (startIndex === -1 || endIndex === -1 || endIndex <= startIndex) {
    throw new Error(`Missing inject section ${sectionName} in ${INJECT_FILE}`);
  }
  return fileText.slice(startIndex + startMarker.length, endIndex).trim();
}

function policySummary() {
  return readInjectSection('session-start');
}

function userPromptReminder() {
  return readInjectSection('user-prompt');
}

function searchFirstWarning(filePath, strict) {
  const unknownPath = filePath || '(unknown)';
  if (strict) {
    return (
      `[claude-forms] Blocked: new file ${unknownPath} with zero Read/Grep/Glob since the last user prompt (strict mode). ` +
      'Search the repo for existing implementations first (Grep/Glob/Read), then retry.'
    );
  }
  return (
    `[claude-forms] About to write new file ${unknownPath} without any Read/Grep/Glob since the last user prompt. ` +
    'Search the repo for existing implementations and conventions first; extend in place when possible.'
  );
}

function stopGroundingReminder() {
  return readInjectSection('stop');
}

module.exports = {
  policySummary,
  userPromptReminder,
  searchFirstWarning,
  stopGroundingReminder,
};
