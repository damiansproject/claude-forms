#!/usr/bin/env node
'use strict';

const { runHook } = require('../../shared/run-hook');
const { writeJson, cursorDeny, sessionId, filePathFromTool } = require('../../shared/io');
const { handlePreWrite } = require('../../shared/handlers');

function onFailure() {
  writeJson({});
  process.exit(0);
}

async function main(input) {
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
}

runHook(main, onFailure);
