#!/usr/bin/env node
'use strict';

const { readStdin, writeJson } = require('../../shared/io');
const { handleStop } = require('../../shared/handlers');

readStdin()
  .then(() => {
    const { context } = handleStop();
    // Soft reminder only — do not force follow-up loops.
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
