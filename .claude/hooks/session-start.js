#!/usr/bin/env node
'use strict';

const { runHook } = require('../../shared/run-hook');
const { claudeContext, sessionId } = require('../../shared/io');
const { handleSessionStart } = require('../../shared/handlers');

async function main(input) {
  const { context } = handleSessionStart(sessionId(input), input.source);
  if (context) {
    claudeContext('SessionStart', context);
  }
}

runHook(main);
