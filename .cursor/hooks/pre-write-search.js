#!/usr/bin/env node
'use strict';

const { readStdin, parseInput, cursorAllow, sessionId, filePathFromTool } = require('../../shared/io');
const { handlePreWrite } = require('../../shared/handlers');

readStdin()
  .then((raw) => {
    const input = parseInput(raw);
    const toolName = input.tool_name || input.toolName || input.tool || '';
    const filePath = filePathFromTool(input);
    const { context } = handlePreWrite(sessionId(input), toolName, filePath);
    if (context) {
      cursorAllow({ agent_message: context, additional_context: context });
    } else {
      cursorAllow();
    }
  })
  .catch(() => {
    process.stdout.write(JSON.stringify({ permission: 'allow' }));
    process.exit(0);
  });
