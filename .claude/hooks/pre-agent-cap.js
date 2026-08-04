#!/usr/bin/env node
'use strict';

const { readStdin, parseInput, claudeDeny, claudeAllow, sessionId } = require('../../shared/io');
const { handlePreAgent } = require('../../shared/handlers');

readStdin()
  .then((raw) => {
    const input = parseInput(raw);
    const result = handlePreAgent(sessionId(input));
    if (!result.allowed) {
      claudeDeny(result.reason);
      return;
    }
    if (result.warn) {
      claudeAllow(result.warn, result.warn);
      return;
    }
    // allow silently
  })
  .catch(() => process.exit(0));
