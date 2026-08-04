#!/usr/bin/env node
'use strict';

const { readStdin, parseInput, cursorDeny, cursorAllow, sessionId } = require('../../shared/io');
const { handlePreAgent } = require('../../shared/handlers');

readStdin()
  .then((raw) => {
    const input = parseInput(raw);
    const result = handlePreAgent(sessionId(input));
    if (!result.allowed) {
      cursorDeny(result.reason);
      return;
    }
    if (result.warn) {
      cursorAllow({ agent_message: result.warn });
      return;
    }
    cursorAllow();
  })
  .catch(() => {
    process.stdout.write(JSON.stringify({ permission: 'allow' }));
    process.exit(0);
  });
