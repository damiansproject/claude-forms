#!/usr/bin/env node
'use strict';

const { runHook } = require('../../shared/run-hook');
const { writeJson, cursorDeny, sessionId } = require('../../shared/io');
const { handlePreAgent } = require('../../shared/handlers');

function onFailure() {
  writeJson({});
  process.exit(0);
}

async function main(input) {
  const result = handlePreAgent(sessionId(input));
  if (!result.allowed) {
    cursorDeny(result.reason);
    return;
  }
  if (result.warn) {
    writeJson({ user_message: result.warn });
    return;
  }
  writeJson({});
}

runHook(main, onFailure);
