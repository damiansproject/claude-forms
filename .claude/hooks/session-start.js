#!/usr/bin/env node
'use strict';

const { readStdin, parseInput, claudeContext, sessionId } = require('../../shared/io');
const { handleSessionStart } = require('../../shared/handlers');

readStdin()
  .then((raw) => {
    const input = parseInput(raw);
    const { context } = handleSessionStart(sessionId(input));
    if (context) {
      claudeContext('SessionStart', context);
    }
  })
  .catch(() => process.exit(0));
