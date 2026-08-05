#!/usr/bin/env node
'use strict';

const { runHook } = require('../../shared/run-hook');
const { claudeDeny, claudeContext, sessionId } = require('../../shared/io');
const { handlePreAgent } = require('../../shared/handlers');

async function main(input) {
  const result = handlePreAgent(sessionId(input));
  if (!result.allowed) {
    claudeDeny(result.reason);
    return;
  }
  if (result.warn) {
    // Context only; do not set permissionDecision.
    claudeContext('PreToolUse', result.warn);
  }
}

runHook(main);
