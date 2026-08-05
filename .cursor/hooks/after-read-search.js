#!/usr/bin/env node
'use strict';

const { runHook } = require('../../shared/run-hook');
const { writeJson, sessionId } = require('../../shared/io');
const { handleTrackRead } = require('../../shared/handlers');

function onFailure() {
  writeJson({});
  process.exit(0);
}

async function main(input) {
  handleTrackRead(sessionId(input));
  writeJson({});
}

runHook(main, onFailure);
