#!/usr/bin/env node
'use strict';

const { readStdin, parseInput, writeJson, sessionId } = require('../../shared/io');
const { handleUserPrompt } = require('../../shared/handlers');

readStdin()
  .then((raw) => {
    const input = parseInput(raw);
    const prompt = input.prompt || '';
    const promptId = input.prompt_id || input.promptId || null;
    const { context } = handleUserPrompt(sessionId(input), prompt, promptId);
    if (context) {
      writeJson({
        hookSpecificOutput: {
          hookEventName: 'UserPromptSubmit',
          additionalContext: context,
        },
      });
    }
  })
  .catch(() => process.exit(0));
