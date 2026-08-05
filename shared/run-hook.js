'use strict';

// Read stdin JSON, run the hook handler, exit cleanly on failure.
const { readStdin, parseInput } = require('./io');

async function runHook(handler, onFailure) {
  try {
    const raw = await readStdin();
    const input = parseInput(raw);
    await handler(input);
  } catch (error) {
    if (onFailure) {
      onFailure(error);
      return;
    }
    process.exit(0);
  }
}

module.exports = { runHook };
