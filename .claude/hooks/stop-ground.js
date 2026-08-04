#!/usr/bin/env node
'use strict';

const { readStdin, writeJson } = require('../../shared/io');
const { handleStop } = require('../../shared/handlers');

// Soft only: systemMessage is shown to the user. Do NOT use additionalContext
// on Stop — that continues the conversation and can loop.
readStdin()
  .then(() => {
    const { context } = handleStop();
    if (context) {
      writeJson({ systemMessage: context, suppressOutput: true });
    }
  })
  .catch(() => process.exit(0));
