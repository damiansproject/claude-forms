#!/usr/bin/env node
'use strict';

const { runHook } = require('../../shared/run-hook');
const { sessionId } = require('../../shared/io');
const { handleTrackRead } = require('../../shared/handlers');

async function main(input) {
  handleTrackRead(sessionId(input));
}

runHook(main);
