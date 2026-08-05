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
  // No synthetic fallback id: with no platform id, duplicate firings are
  // detected by prompt text instead.
  const promptId = input.generation_id || input.prompt_id || input.promptId || null;
  const { optedIn, duplicate } = handleUserPrompt(sessionId(input), prompt, promptId);
  const response = { continue: true };
  if (optedIn && !duplicate) {
    response.user_message =
      '[claude-forms] Parallel agents enabled for this session (opt-in detected).';
  }
  writeJson(response);
}

runHook(main, onFailure);
