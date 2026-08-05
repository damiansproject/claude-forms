#!/usr/bin/env node
'use strict';

const { runHook } = require('../../shared/run-hook');
const { writeJson, sessionId } = require('../../shared/io');
const { handleSessionStart } = require('../../shared/handlers');

function onFailure() {
  writeJson({});
  process.exit(0);
}

async function main(input) {
  const { context } = handleSessionStart(sessionId(input), input.source);
  if (context) {
    writeJson({ additional_context: context });
  } else {
    writeJson({});
  }
}

runHook(main, onFailure);
