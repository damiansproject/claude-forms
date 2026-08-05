#!/usr/bin/env node
'use strict';

/**
 * Install claude-forms for all projects (user-level).
 * Usage: node scripts/install-user.js [--dry-run]
 */

const fs = require('fs');
const os = require('os');
const path = require('path');
const {
  claudeHookFragment,
  cursorHookFragment,
  mergeClaudeHooks,
  mergeCursorHooks,
  readJsonFile,
} = require('./install-shared');

const REPO_ROOT = path.resolve(__dirname, '..');
const DRY_RUN = process.argv.includes('--dry-run');
const HOME = process.env.HOME || process.env.USERPROFILE || os.homedir();
const INSTALL_ROOT =
  process.env.CLAUDE_FORM_INSTALL_DIR ||
  path.join(process.env.XDG_DATA_HOME || path.join(HOME, '.local', 'share'), 'claude-forms');

const PATHS = {
  claudeHooks: path.join(INSTALL_ROOT, '.claude', 'hooks'),
  cursorHooks: path.join(INSTALL_ROOT, '.cursor', 'hooks'),
  claudeSettings: path.join(HOME, '.claude', 'settings.json'),
  cursorHooksJson: path.join(HOME, '.cursor', 'hooks.json'),
  claudeRules: path.join(HOME, '.claude', 'rules'),
  claudeSkills: path.join(HOME, '.claude', 'skills'),
  cursorRules: path.join(HOME, '.cursor', 'rules'),
  cursorSkills: path.join(HOME, '.cursor', 'skills'),
};

function log(message) {
  if (DRY_RUN) {
    console.log(`[dry-run] ${message}`);
    return;
  }
  console.log(message);
}

function ensureDir(dir) {
  if (DRY_RUN) {
    return;
  }
  fs.mkdirSync(dir, { recursive: true });
}

function copyTree(sourceDir, destDir) {
  if (!fs.existsSync(sourceDir)) {
    return;
  }
  if (DRY_RUN) {
    log(`copy ${sourceDir}/ -> ${destDir}/`);
    return;
  }
  fs.cpSync(sourceDir, destDir, { recursive: true });
}

function writeJsonFile(filePath, data) {
  if (DRY_RUN) {
    log(`write ${filePath}`);
    return;
  }
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`);
}

function patchSkillContent(text, installRoot) {
  const lessonsPath = path.join(installRoot, 'templates', 'LESSONS.md.snippet');
  let updated = text.replace(
    /\]\(\.\.\/\.\.\/\.\.\/shared\/([^)]+)\)/g,
    (_, fileName) => `](${path.join(installRoot, 'shared', fileName)})`,
  );
  updated = updated.replace(/`templates\/LESSONS\.md\.snippet`/g, `\`${lessonsPath}\``);
  updated = updated.replace(/\(project root\)/g, '(install root)');
  return updated;
}

function installSkills(destSkillsDir, installRoot) {
  const sourceSkillsDir = path.join(REPO_ROOT, '.claude', 'skills');
  if (!fs.existsSync(sourceSkillsDir)) {
    return;
  }
  for (const skillName of fs.readdirSync(sourceSkillsDir)) {
    const skillDir = path.join(sourceSkillsDir, skillName);
    const skillFile = path.join(skillDir, 'SKILL.md');
    if (!fs.statSync(skillDir).isDirectory() || !fs.existsSync(skillFile)) {
      continue;
    }
    const destFile = path.join(destSkillsDir, skillName, 'SKILL.md');
    const content = patchSkillContent(fs.readFileSync(skillFile, 'utf8'), installRoot);
    if (DRY_RUN) {
      log(`skill ${destFile}`);
    } else {
      ensureDir(path.dirname(destFile));
      fs.writeFileSync(destFile, content);
    }
  }
}

function patchRuleContent(text, installRoot) {
  const policyPath = path.join(installRoot, 'shared', 'policy.md');
  return text.replace(
    /see `shared\/policy\.md` in the claude-forms project[^.]*\./g,
    `see ${policyPath}.`,
  );
}

function installRules() {
  const ruleCopies = [
    {
      sourceRel: '.claude/rules/no-overengineer.md',
      destDir: PATHS.claudeRules,
      fileName: 'no-overengineer.md',
    },
    {
      sourceRel: '.cursor/rules/no-overengineer.mdc',
      destDir: PATHS.cursorRules,
      fileName: 'no-overengineer.mdc',
    },
  ];

  for (const ruleCopy of ruleCopies) {
    const sourcePath = path.join(REPO_ROOT, ruleCopy.sourceRel);
    if (!fs.existsSync(sourcePath)) {
      continue;
    }
    const destPath = path.join(ruleCopy.destDir, ruleCopy.fileName);
    const text = patchRuleContent(fs.readFileSync(sourcePath, 'utf8'), INSTALL_ROOT);
    if (DRY_RUN) {
      log(`rule ${destPath}`);
    } else {
      ensureDir(ruleCopy.destDir);
      fs.writeFileSync(destPath, text);
    }
  }
}

function main() {
  if (!HOME) {
    throw new Error('Could not resolve home directory (HOME/USERPROFILE/os.homedir)');
  }

  log(`Installing claude-forms to ${INSTALL_ROOT}`);

  copyTree(path.join(REPO_ROOT, 'shared'), path.join(INSTALL_ROOT, 'shared'));
  copyTree(path.join(REPO_ROOT, '.claude', 'hooks'), PATHS.claudeHooks);
  copyTree(path.join(REPO_ROOT, '.cursor', 'hooks'), PATHS.cursorHooks);
  copyTree(path.join(REPO_ROOT, 'templates'), path.join(INSTALL_ROOT, 'templates'));

  installSkills(PATHS.claudeSkills, INSTALL_ROOT);
  installSkills(PATHS.cursorSkills, INSTALL_ROOT);
  installRules();

  const claudeSettings = readJsonFile(PATHS.claudeSettings);
  claudeSettings.hooks = mergeClaudeHooks(
    claudeSettings.hooks || {},
    claudeHookFragment(REPO_ROOT, INSTALL_ROOT),
  );
  writeJsonFile(PATHS.claudeSettings, claudeSettings);

  const cursorConfig = mergeCursorHooks(
    readJsonFile(PATHS.cursorHooksJson),
    cursorHookFragment(REPO_ROOT, INSTALL_ROOT),
  );
  writeJsonFile(PATHS.cursorHooksJson, cursorConfig);

  log('Done.');
  log(`  Runtime: ${INSTALL_ROOT}`);
  log(`  Claude: ${PATHS.claudeSettings} (hooks merged)`);
  log(`  Cursor: ${PATHS.cursorHooksJson}`);
  log(`  Skills: ${PATHS.claudeSkills}, ${PATHS.cursorSkills}`);
  log(`  Rules:  ${PATHS.claudeRules}, ${PATHS.cursorRules}`);
  log('Re-run after upgrading claude-forms. Set CLAUDE_FORM_DISABLED=1 to skip in a project.');
}

main();
