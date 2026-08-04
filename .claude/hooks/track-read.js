#!/usr/bin/env node
'use strict';

const { readStdin, parseInput, sessionId } = require('../../shared/io');
const { handleTrackRead } = require('../../shared/handlers');

readStdin()
  .then((raw) => {
    const input = parseInput(raw);
    handleTrackRead(sessionId(input));
  })
  .catch(() => process.exit(0));
