#!/usr/bin/env node
'use strict';

const { readStdin, parseInput, writeJson, sessionId } = require('../../shared/io');
const { handleSessionStart } = require('../../shared/handlers');

readStdin()
  .then((raw) => {
    const input = parseInput(raw);
    const { context } = handleSessionStart(sessionId(input), input.source);
    if (context) {
      writeJson({ additional_context: context });
    } else {
      writeJson({});
    }
  })
  .catch(() => {
    writeJson({});
    process.exit(0);
  });
