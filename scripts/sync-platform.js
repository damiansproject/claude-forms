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
const POLICY_MD = path.join(ROOT, 'shared', 'policy.md');

const PROMPT_SKILL_TO_SHARED = {
  'prompt-general': 'prompt-general.md',
  'prompt-opus-5': 'prompt-opus.md',
  'prompt-fable-5': 'prompt-fable.md',
};

const CURSOR_RULE_FRONTMATTER = `---
description: >-
  Prevents overengineering, over-scoping, and reinventing existing code. Applies
  when implementing features, fixing bugs, refactoring, writing new
  files/utilities, or spawning subagents.
alwaysApply: true
---
`;

const POLICY_MD_HEADER = `# Claude Forms — no overengineering

Human reference. **Edit the always-on rule:** \`.claude/rules/no-overengineer.md\`. \`npm run sync\` mirrors its body into this file, the \`no-overengineer\` skill, and \`.cursor/rules/no-overengineer.mdc\`.

## What the model actually receives

| Channel | When | Source |
|---|---|---|
| **Rule** (Claude Code \`.claude/rules/\`, Cursor \`alwaysApply\`) | Every turn | \`.claude/rules/no-overengineer.md\` |
| **Hooks** | Session start, each prompt, stop (Claude Code); partial on Cursor | \`shared/policy-inject.md\` — short reminders, not the full rule |
| **Skills** | When you invoke or the harness matches them | Self-contained \`.claude/skills/*/SKILL.md\` files |

Hook strings are intentionally compressed to save tokens on repeat injection. The full policy lives in the rule so the model does not need to open a linked file.

---

`;

const POLICY_MD_FOOTER = `
## Model-specific skills

Invoke \`prompt-general\`, \`prompt-opus-5\`, or \`prompt-fable-5\` for model-specific behavior (full rules live in those skill files).
`;

function splitSkillFile(text) {
  const normalized = text.replace(/\r\n/g, '\n');
  if (!normalized.startsWith('---')) {
    return { frontmatter: '', body: normalized };
  }
  const end = normalized.indexOf('---', 3);
  if (end === -1) {
    return { frontmatter: '', body: normalized };
  }
  return {
    frontmatter: normalized.slice(0, end + 3),
    body: normalized.slice(end + 3).replace(/^\n/, ''),
  };
}

function skillBody(skillPath) {
  return splitSkillFile(fs.readFileSync(skillPath, 'utf8')).body.trimEnd() + '\n';
}

function readRuleBody() {
  return fs.readFileSync(CLAUDE_RULE, 'utf8').replace(/\r\n/g, '\n').trimEnd();
}

function syncNoOverengineerSkill() {
  const skillPath = path.join(CLAUDE_SKILLS, 'no-overengineer', 'SKILL.md');
  if (!fs.existsSync(skillPath) || !fs.existsSync(CLAUDE_RULE)) {
    return;
  }
  const { frontmatter } = splitSkillFile(fs.readFileSync(skillPath, 'utf8'));
  const ruleBody = readRuleBody();
  const seeAlso = `
## See also

- \`prompt-general\` — general agent behavior when no model-specific guide applies
- \`prompt-opus-5\` — Opus 5 behavior
- \`prompt-fable-5\` — Fable 5 behavior
`;
  fs.writeFileSync(skillPath, `${frontmatter}\n\n${ruleBody}${seeAlso}\n`);
}

function syncPolicyMd() {
  if (!fs.existsSync(CLAUDE_RULE)) {
    return;
  }
  fs.writeFileSync(POLICY_MD, `${POLICY_MD_HEADER}${readRuleBody()}${POLICY_MD_FOOTER}\n`);
}

function syncPromptSharedFiles() {
  for (const [skillName, sharedFileName] of Object.entries(PROMPT_SKILL_TO_SHARED)) {
    const skillPath = path.join(CLAUDE_SKILLS, skillName, 'SKILL.md');
    if (!fs.existsSync(skillPath)) {
      continue;
    }
    const destPath = path.join(ROOT, 'shared', sharedFileName);
    fs.writeFileSync(destPath, skillBody(skillPath));
  }
}

function copyFile(sourcePath, destPath) {
  fs.mkdirSync(path.dirname(destPath), { recursive: true });
  fs.copyFileSync(sourcePath, destPath);
}

function syncSkills() {
  if (!fs.existsSync(CLAUDE_SKILLS)) {
    return;
  }
  for (const skillName of fs.readdirSync(CLAUDE_SKILLS)) {
    const sourcePath = path.join(CLAUDE_SKILLS, skillName, 'SKILL.md');
    if (!fs.existsSync(sourcePath)) {
      continue;
    }
    const destPath = path.join(CURSOR_SKILLS, skillName, 'SKILL.md');
    copyFile(sourcePath, destPath);
  }
}

function syncRule() {
  if (!fs.existsSync(CLAUDE_RULE)) {
    return;
  }
  const body = fs.readFileSync(CLAUDE_RULE, 'utf8').replace(/\r\n/g, '\n');
  fs.mkdirSync(path.dirname(CURSOR_RULE), { recursive: true });
  fs.writeFileSync(CURSOR_RULE, `${CURSOR_RULE_FRONTMATTER}\n${body}`);
}

function main() {
  syncNoOverengineerSkill();
  syncPolicyMd();
  syncSkills();
  syncRule();
  syncPromptSharedFiles();
  console.log('Synced .claude skills/rules to .cursor');
}

main();
