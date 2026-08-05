#!/usr/bin/env node
'use strict';

const { readStdin, parseInput, writeJson, cursorDeny, sessionId, filePathFromTool } = require('../../shared/io');
const { handlePreWrite } = require('../../shared/handlers');

readStdin()
  .then((raw) => {
    const input = parseInput(raw);
    const toolName = input.tool_name || input.toolName || input.tool || 'Write';
    const filePath = filePathFromTool(input);
    const { context, deny } = handlePreWrite(sessionId(input), toolName, filePath);
    if (deny) {
      cursorDeny(context);
      return;
    }
    if (context) {
      writeJson({ agent_message: context });
      return;
    }
    writeJson({});
  })
  .catch(() => {
    writeJson({});
    process.exit(0);
  });
