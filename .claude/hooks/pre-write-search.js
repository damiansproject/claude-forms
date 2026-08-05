#!/usr/bin/env node
'use strict';

const { runHook } = require('../../shared/run-hook');
const { claudeDeny, claudeContext, sessionId, filePathFromTool } = require('../../shared/io');
const { handlePreWrite } = require('../../shared/handlers');

async function main(input) {
  const toolName = input.tool_name || input.toolName || '';
  const filePath = filePathFromTool(input);
  const { context, deny } = handlePreWrite(sessionId(input), toolName, filePath);
  if (deny) {
    claudeDeny(context);
    return;
  }
  if (context) {
    claudeContext('PreToolUse', context);
  }
}

runHook(main);
