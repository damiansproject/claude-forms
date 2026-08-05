#!/usr/bin/env node
'use strict';

/**
 * Mirror Claude-canonical skills/rules into Cursor paths so they cannot drift.
 * Usage: node scripts/sync-platform.js
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const CLAUDE_SKILLS = path.join(ROOT, '.claude', 'skills');
const CURSOR_SKILLS = path.join(ROOT, '.cursor', 'skills');
const CLAUDE_RULE = path.join(ROOT, '.claude', 'rules', 'no-overengineer.md');
const CURSOR_RULE = path.join(ROOT, '.cursor', 'rules', 'no-overengineer.mdc');

const CURSOR_RULE_FRONTMATTER = `---
description: >-
  Prevents overengineering, over-scoping, and reinventing existing code for Claude
  Opus 5 and Fable 5. Applies when implementing features, fixing bugs, refactoring,
  writing new files/utilities, or spawning subagents.
alwaysApply: true
---
`;

function copyFile(src, dest) {
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
}

function syncSkills() {
  if (!fs.existsSync(CLAUDE_SKILLS)) return;
  for (const name of fs.readdirSync(CLAUDE_SKILLS)) {
    const src = path.join(CLAUDE_SKILLS, name, 'SKILL.md');
    if (!fs.existsSync(src)) continue;
    copyFile(src, path.join(CURSOR_SKILLS, name, 'SKILL.md'));
  }
}

function syncRule() {
  if (!fs.existsSync(CLAUDE_RULE)) return;
  const body = fs.readFileSync(CLAUDE_RULE, 'utf8').replace(/\r\n/g, '\n');
  fs.mkdirSync(path.dirname(CURSOR_RULE), { recursive: true });
  fs.writeFileSync(CURSOR_RULE, `${CURSOR_RULE_FRONTMATTER}\n${body}`);
}

syncSkills();
syncRule();
console.log('Synced .claude skills/rules → .cursor');
