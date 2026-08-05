#!/usr/bin/env node
'use strict';

const { runHook } = require('../../shared/run-hook');
const { claudeContext, sessionId } = require('../../shared/io');
const { handleUserPrompt } = require('../../shared/handlers');

async function main(input) {
  const prompt = input.prompt || '';
  const promptId = input.prompt_id || input.promptId || null;
  const { context } = handleUserPrompt(sessionId(input), prompt, promptId);
  if (context) {
    claudeContext('UserPromptSubmit', context);
  }
}

runHook(main);
