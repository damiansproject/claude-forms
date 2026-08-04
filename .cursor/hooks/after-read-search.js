#!/usr/bin/env node
'use strict';

const { readStdin, parseInput, writeJson, sessionId } = require('../../shared/io');
const { handleTrackRead } = require('../../shared/handlers');

readStdin()
  .then((raw) => {
    const input = parseInput(raw);
    handleTrackRead(sessionId(input));
    writeJson({});
  })
  .catch(() => {
    writeJson({});
    process.exit(0);
  });
