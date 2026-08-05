#!/usr/bin/env node
'use strict';

const { runHook } = require('../../shared/run-hook');
const { writeJson, sessionId } = require('../../shared/io');
const { handleStop } = require('../../shared/handlers');

// systemMessage only (once per session); additionalContext on Stop loops.
async function main(input) {
  const { context } = handleStop(sessionId(input));
  if (context) {
    writeJson({ systemMessage: context, suppressOutput: true });
  }
}

runHook(main);
