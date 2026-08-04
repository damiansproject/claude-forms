#!/usr/bin/env node
'use strict';

const { readStdin, parseInput, claudeAllow, sessionId, filePathFromTool } = require('../../shared/io');
const { handlePreWrite } = require('../../shared/handlers');

readStdin()
  .then((raw) => {
    const input = parseInput(raw);
    const toolName = input.tool_name || input.toolName || '';
    const filePath = filePathFromTool(input);
    const { context } = handlePreWrite(sessionId(input), toolName, filePath);
    if (context) {
      claudeAllow(context);
    }
    // Soft warn only: exit 0 with no JSON also fine
  })
  .catch(() => process.exit(0));
