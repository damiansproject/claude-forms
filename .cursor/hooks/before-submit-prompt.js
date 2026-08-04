#!/usr/bin/env node
'use strict';

const { readStdin, parseInput, writeJson, sessionId } = require('../../shared/io');
const { handleUserPrompt } = require('../../shared/handlers');

readStdin()
  .then((raw) => {
    const input = parseInput(raw);
    const prompt = input.prompt || input.content || input.message || '';
    const promptId = input.prompt_id || input.promptId || String(Date.now());
    const { context } = handleUserPrompt(sessionId(input), prompt, promptId);
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
