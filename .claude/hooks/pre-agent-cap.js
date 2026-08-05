#!/usr/bin/env node
'use strict';

const { runHook } = require('../../shared/run-hook');
const { claudeDeny, claudeContext, sessionId } = require('../../shared/io');
const { handlePreAgent } = require('../../shared/handlers');

async function main(input) {
  // tool_use_id lets duplicate firings (project + user install) share one budget slot.
  const toolUseId = input.tool_use_id || input.toolUseId || null;
  const result = handlePreAgent(sessionId(input), toolUseId);
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
