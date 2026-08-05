#!/usr/bin/env node
'use strict';

/**
 * Remove the user-level claude-forms install from Claude Code and Cursor.
 * Usage: node scripts/uninstall-user.js [--dry-run] [--purge]
 */

const fs = require('fs');
const os = require('os');
const path = require('path');
const { readJsonFile, stripClaudeHooks, stripCursorHooks } = require('./install-shared');

const DRY_RUN = process.argv.includes('--dry-run');
const PURGE = process.argv.includes('--purge');
const HOME = process.env.HOME || process.env.USERPROFILE || os.homedir();
const INSTALL_ROOT =
  process.env.CLAUDE_FORM_INSTALL_DIR ||
  path.join(process.env.XDG_DATA_HOME || path.join(HOME, '.local', 'share'), 'claude-forms');

const PATHS = {
  claudeSettings: path.join(HOME, '.claude', 'settings.json'),
  cursorHooksJson: path.join(HOME, '.cursor', 'hooks.json'),
  claudeRules: path.join(HOME, '.claude', 'rules'),
  cursorRules: path.join(HOME, '.cursor', 'rules'),
  claudeSkills: path.join(HOME, '.claude', 'skills'),
  cursorSkills: path.join(HOME, '.cursor', 'skills'),
};

const SKILL_NAMES = ['no-overengineer', 'prompt-general', 'prompt-opus-5', 'prompt-fable-5'];
const RULE_FILES = [
  { dir: PATHS.claudeRules, fileName: 'no-overengineer.md' },
  { dir: PATHS.cursorRules, fileName: 'no-overengineer.mdc' },
];

function log(message) {
  if (DRY_RUN) {
    console.log(`[dry-run] ${message}`);
    return;
  }
  console.log(message);
}

function writeJsonFile(filePath, data) {
  if (DRY_RUN) {
    log(`write ${filePath}`);
    return;
  }
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`);
}

function removePath(targetPath) {
  if (!fs.existsSync(targetPath)) {
    return;
  }
  log(`remove ${targetPath}`);
  if (DRY_RUN) {
    return;
  }
  fs.rmSync(targetPath, { recursive: true, force: true });
}

function main() {
  if (!HOME) {
    throw new Error('Could not resolve home directory (HOME/USERPROFILE/os.homedir)');
  }

  log(`Uninstalling claude-forms user install (root ${INSTALL_ROOT})`);

  if (fs.existsSync(PATHS.claudeSettings)) {
    const settings = readJsonFile(PATHS.claudeSettings);
    settings.hooks = stripClaudeHooks(settings.hooks || {});
    writeJsonFile(PATHS.claudeSettings, settings);
    log(`stripped hooks from ${PATHS.claudeSettings}`);
  }

  if (fs.existsSync(PATHS.cursorHooksJson)) {
    const config = stripCursorHooks(readJsonFile(PATHS.cursorHooksJson));
    writeJsonFile(PATHS.cursorHooksJson, config);
    log(`stripped hooks from ${PATHS.cursorHooksJson}`);
  }

  for (const ruleFile of RULE_FILES) {
    removePath(path.join(ruleFile.dir, ruleFile.fileName));
  }
  for (const skillName of SKILL_NAMES) {
    removePath(path.join(PATHS.claudeSkills, skillName));
    removePath(path.join(PATHS.cursorSkills, skillName));
  }

  if (PURGE) {
    removePath(INSTALL_ROOT);
  } else {
    log(`left runtime at ${INSTALL_ROOT} (pass --purge to delete)`);
  }

  log('Done.');
}

main();
