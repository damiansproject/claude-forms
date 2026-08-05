#!/usr/bin/env node
'use strict';

const { runHook } = require('../../shared/run-hook');
const { writeJson, sessionId } = require('../../shared/io');
const { handleUserPrompt } = require('../../shared/handlers');

// State side effects only — Cursor can't inject agent context here.
function onFailure() {
  writeJson({ continue: true });
  process.exit(0);
}

async function main(input) {
  const prompt = input.prompt || input.content || input.message || '';
  const promptId = input.generation_id || input.prompt_id || input.promptId || String(Date.now());
  const { optedIn } = handleUserPrompt(sessionId(input), prompt, promptId);
  const response = { continue: true };
  if (optedIn) {
    response.user_message =
      '[claude-forms] Parallel agents enabled for this session (opt-in detected).';
  }
  writeJson(response);
}

runHook(main, onFailure);
