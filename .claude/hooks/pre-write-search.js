#!/usr/bin/env node
'use strict';

const { readStdin, parseInput, claudeDeny, claudeContext, sessionId, filePathFromTool } = require('../../shared/io');
const { handlePreWrite } = require('../../shared/handlers');

readStdin()
  .then((raw) => {
    const input = parseInput(raw);
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
  })
  .catch(() => process.exit(0));
