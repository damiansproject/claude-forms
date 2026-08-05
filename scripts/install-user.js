#!/usr/bin/env node
'use strict';

/**
 * Install claude-forms for all projects (user-level).
 * Usage: node scripts/install-user.js [--dry-run]
 *
 * Hook fragments are derived from the repo's `.claude/settings.json` and
 * `.cursor/hooks.json` so they cannot drift from the project drop-in.
 */

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const REPO_ROOT = path.resolve(__dirname, '..');
const DRY_RUN = process.argv.includes('--dry-run');
const HOME = process.env.HOME || '';
const INSTALL_ROOT =
  process.env.CLAUDE_FORM_INSTALL_DIR ||
  path.join(process.env.XDG_DATA_HOME || path.join(HOME, '.local', 'share'), 'claude-forms');

const PATHS = {
  installRoot: INSTALL_ROOT,
  claudeHooks: path.join(INSTALL_ROOT, '.claude', 'hooks'),
  cursorHooks: path.join(INSTALL_ROOT, '.cursor', 'hooks'),
  claudeSettings: path.join(HOME, '.claude', 'settings.json'),
  cursorHooksJson: path.join(HOME, '.cursor', 'hooks.json'),
  claudeRules: path.join(HOME, '.claude', 'rules'),
  claudeSkills: path.join(HOME, '.claude', 'skills'),
  cursorRules: path.join(HOME, '.cursor', 'rules'),
  cursorSkills: path.join(HOME, '.cursor', 'skills'),
};

function log(msg) {
  console.log(DRY_RUN ? `[dry-run] ${msg}` : msg);
}

function ensureDir(dir) {
  if (DRY_RUN) return;
  fs.mkdirSync(dir, { recursive: true });
}

function copyTree(srcDir, destDir) {
  if (!fs.existsSync(srcDir)) return;
  if (DRY_RUN) {
    log(`rsync ${srcDir}/ -> ${destDir}/`);
    return;
  }
  ensureDir(destDir);
  const result = spawnSync('rsync', ['-a', `${srcDir}/`, `${destDir}/`], { encoding: 'utf8' });
  if (result.status !== 0) {
    throw new Error(`rsync failed: ${result.stderr || result.stdout}`);
  }
}

function readJson(file, fallback) {
  if (!fs.existsSync(file)) return fallback;
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function writeJson(file, data) {
  if (DRY_RUN) {
    log(`write ${file}`);
    return;
  }
  ensureDir(path.dirname(file));
  fs.writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`);
}

function patchSkillContent(text, root) {
  const lessons = path.join(root, 'templates', 'LESSONS.md.snippet');
  return text
    .replace(
      /\]\(\.\.\/\.\.\/\.\.\/shared\/([^)]+)\)/g,
      (_, file) => `](${path.join(root, 'shared', file)})`
    )
    .replace(/`templates\/LESSONS\.md\.snippet`/g, `\`${lessons}\``)
    .replace(/\(project root\)/g, '(install root)');
}

function installSkills(srcSkillsDir, destSkillsDir, root) {
  if (!fs.existsSync(srcSkillsDir)) return;
  for (const name of fs.readdirSync(srcSkillsDir)) {
    const skillDir = path.join(srcSkillsDir, name);
    const skillFile = path.join(skillDir, 'SKILL.md');
    if (!fs.statSync(skillDir).isDirectory() || !fs.existsSync(skillFile)) continue;
    const destFile = path.join(destSkillsDir, name, 'SKILL.md');
    const content = patchSkillContent(fs.readFileSync(skillFile, 'utf8'), root);
    if (DRY_RUN) log(`skill ${destFile}`);
    else {
      ensureDir(path.dirname(destFile));
      fs.writeFileSync(destFile, content);
    }
  }
}

function patchRuleContent(text, root) {
  const policy = path.join(root, 'shared', 'policy.md');
  return text.replace(
    /see `shared\/policy\.md` in the claude-forms project[^.]*\./g,
    `see ${policy}.`
  );
}

function installRules() {
  const pairs = [
    ['.claude/rules/no-overengineer.md', PATHS.claudeRules, 'no-overengineer.md'],
    ['.cursor/rules/no-overengineer.mdc', PATHS.cursorRules, 'no-overengineer.mdc'],
  ];
  for (const [rel, destDir, name] of pairs) {
    const src = path.join(REPO_ROOT, rel);
    if (!fs.existsSync(src)) continue;
    const dest = path.join(destDir, name);
    const text = patchRuleContent(fs.readFileSync(src, 'utf8'), INSTALL_ROOT);
    if (DRY_RUN) log(`rule ${dest}`);
    else {
      ensureDir(destDir);
      fs.writeFileSync(dest, text);
    }
  }
}

/** Rewrite project Claude settings hooks to absolute install-root paths. */
function claudeHookFragment(root) {
  const hooks = readJson(path.join(REPO_ROOT, '.claude', 'settings.json'), {}).hooks || {};
  const out = {};
  for (const [event, groups] of Object.entries(hooks)) {
    out[event] = groups.map((group) => ({
      ...group,
      hooks: (group.hooks || []).map((h) => ({
        ...h,
        args: (h.args || []).map((a) =>
          String(a).replace('${CLAUDE_PROJECT_DIR}', root)
        ),
      })),
    }));
  }
  return out;
}

/** Rewrite project Cursor hooks.json commands to absolute install-root paths. */
function cursorHookFragment(root) {
  const cfg = readJson(path.join(REPO_ROOT, '.cursor', 'hooks.json'), {});
  const hooks = {};
  for (const [event, entries] of Object.entries(cfg.hooks || {})) {
    hooks[event] = entries.map((e) => ({
      ...e,
      command: String(e.command || '').replace(/^node\s+/, `node ${root}/`),
    }));
  }
  return { version: cfg.version || 1, hooks };
}

function isClaudeFormsHook(entry) {
  const blob = [entry?.command, ...(entry?.args || [])].filter(Boolean).join(' ');
  return blob.includes('claude-forms');
}

function mergeClaudeHooks(existing, fragment) {
  const out = { ...existing };
  for (const [event, groups] of Object.entries(fragment)) {
    const prev = out[event] || [];
    const cleaned = prev
      .map((group) => ({
        ...group,
        hooks: (group.hooks || []).filter((h) => !isClaudeFormsHook(h)),
      }))
      .filter((group) => (group.hooks || []).length > 0);
    out[event] = [...cleaned, ...groups];
  }
  return out;
}

function mergeCursorHooks(existing, fragment) {
  const out = { ...existing, version: existing.version || fragment.version || 1 };
  const hooks = { ...(existing.hooks || {}) };
  for (const [event, entries] of Object.entries(fragment.hooks)) {
    const prev = hooks[event] || [];
    hooks[event] = [
      ...prev.filter((e) => !isClaudeFormsHook(e)),
      ...entries,
    ];
  }
  // Drop orphaned stop entries from older installs (Cursor stop forces a turn).
  if (hooks.stop) {
    hooks.stop = hooks.stop.filter((e) => !isClaudeFormsHook(e));
    if (hooks.stop.length === 0) delete hooks.stop;
  }
  out.hooks = hooks;
  return out;
}

function main() {
  if (!HOME) throw new Error('HOME is not set');

  log(`Installing claude-forms to ${INSTALL_ROOT}`);

  copyTree(path.join(REPO_ROOT, 'shared'), path.join(INSTALL_ROOT, 'shared'));
  copyTree(path.join(REPO_ROOT, '.claude', 'hooks'), PATHS.claudeHooks);
  copyTree(path.join(REPO_ROOT, '.cursor', 'hooks'), PATHS.cursorHooks);
  copyTree(path.join(REPO_ROOT, 'templates'), path.join(INSTALL_ROOT, 'templates'));

  installSkills(path.join(REPO_ROOT, '.claude', 'skills'), PATHS.claudeSkills, INSTALL_ROOT);
  installSkills(path.join(REPO_ROOT, '.cursor', 'skills'), PATHS.cursorSkills, INSTALL_ROOT);
  installRules();

  const claudeSettings = readJson(PATHS.claudeSettings, {});
  claudeSettings.hooks = mergeClaudeHooks(
    claudeSettings.hooks || {},
    claudeHookFragment(INSTALL_ROOT)
  );
  writeJson(PATHS.claudeSettings, claudeSettings);

  const cursorMerged = mergeCursorHooks(
    readJson(PATHS.cursorHooksJson, {}),
    cursorHookFragment(INSTALL_ROOT)
  );
  writeJson(PATHS.cursorHooksJson, cursorMerged);

  log('Done.');
  log(`  Runtime: ${INSTALL_ROOT}`);
  log(`  Claude: ${PATHS.claudeSettings} (hooks merged)`);
  log(`  Cursor: ${PATHS.cursorHooksJson}`);
  log(`  Skills: ${PATHS.claudeSkills}, ${PATHS.cursorSkills}`);
  log(`  Rules:  ${PATHS.claudeRules}, ${PATHS.cursorRules}`);
  log('Re-run after upgrading claude-forms. Set CLAUDE_FORM_DISABLED=1 to skip in a project.');
}

main();
