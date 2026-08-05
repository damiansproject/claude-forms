#!/usr/bin/env node
'use strict';

const { readStdin, parseInput, writeJson, sessionId } = require('../../shared/io');
const { handleStop } = require('../../shared/handlers');

// systemMessage only (once per session); additionalContext on Stop loops.
readStdin()
  .then((raw) => {
    const input = parseInput(raw);
    const { context } = handleStop(sessionId(input));
    if (context) {
      writeJson({ systemMessage: context, suppressOutput: true });
    }
  })
  .catch(() => process.exit(0));
