#!/usr/bin/env node
'use strict';

const { readStdin, parseInput, writeJson, cursorDeny, sessionId } = require('../../shared/io');
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
      writeJson({ user_message: result.warn });
      return;
    }
    writeJson({});
  })
  .catch(() => {
    writeJson({});
    process.exit(0);
  });
