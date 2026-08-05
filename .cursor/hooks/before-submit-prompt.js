#!/usr/bin/env node
'use strict';

const { readStdin, parseInput, writeJson, sessionId } = require('../../shared/io');
const { handleUserPrompt } = require('../../shared/handlers');

// State side effects only — Cursor can't inject agent context here.
readStdin()
  .then((raw) => {
    const input = parseInput(raw);
    const prompt = input.prompt || input.content || input.message || '';
    const promptId = input.generation_id || input.prompt_id || input.promptId || String(Date.now());
    const { optedIn } = handleUserPrompt(sessionId(input), prompt, promptId);
    const out = { continue: true };
    if (optedIn) {
      out.user_message = '[claude-forms] Parallel agents enabled for this session (opt-in detected).';
    }
    writeJson(out);
  })
  .catch(() => {
    writeJson({ continue: true });
    process.exit(0);
  });
