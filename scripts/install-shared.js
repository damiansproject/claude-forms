'use strict';

/**
 * Shared install/uninstall helpers for Claude Code and Cursor hook config.
 * Used by scripts/install-user.js and scripts/uninstall-user.js only.
 */

const fs = require('fs');
const path = require('path');

function readJsonFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return {};
  }
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function isClaudeFormsHook(entry) {
  const parts = [];
  if (entry && entry.command) {
    parts.push(entry.command);
  }
  if (entry && entry.args) {
    for (const arg of entry.args) {
      if (arg) {
        parts.push(arg);
      }
    }
  }
  const text = parts.join(' ');
  return text.includes('claude-forms');
}

function copyObjectReplaceKey(source, keyToReplace, newValue) {
  const copy = {};
  for (const key of Object.keys(source)) {
    if (key === keyToReplace) {
      copy[key] = newValue;
    } else {
      copy[key] = source[key];
    }
  }
  if (!(keyToReplace in source)) {
    copy[keyToReplace] = newValue;
  }
  return copy;
}

function shallowCopy(source) {
  const copy = {};
  for (const key of Object.keys(source)) {
    copy[key] = source[key];
  }
  return copy;
}

/** Build Claude hook groups with install-root paths instead of ${CLAUDE_PROJECT_DIR}. */
function claudeHookFragment(repoRoot, installRoot) {
  const settingsPath = path.join(repoRoot, '.claude', 'settings.json');
  const settings = readJsonFile(settingsPath);
  const sourceHooks = settings.hooks || {};
  const result = {};

  for (const [eventName, groups] of Object.entries(sourceHooks)) {
    const rewrittenGroups = [];
    for (const group of groups) {
      const rewrittenHooks = [];
      for (const hook of group.hooks || []) {
        const rewrittenArgs = [];
        for (const arg of hook.args || []) {
          rewrittenArgs.push(String(arg).replace('${CLAUDE_PROJECT_DIR}', installRoot));
        }
        rewrittenHooks.push(copyObjectReplaceKey(hook, 'args', rewrittenArgs));
      }
      rewrittenGroups.push(copyObjectReplaceKey(group, 'hooks', rewrittenHooks));
    }
    result[eventName] = rewrittenGroups;
  }

  return result;
}

/** Build Cursor hooks.json fragment with absolute install-root script paths. */
function cursorHookFragment(repoRoot, installRoot) {
  const hooksPath = path.join(repoRoot, '.cursor', 'hooks.json');
  const config = readJsonFile(hooksPath);
  const result = {};

  for (const [eventName, entries] of Object.entries(config.hooks || {})) {
    const rewrittenEntries = [];
    for (const entry of entries) {
      const command = String(entry.command || '');
      const match = command.match(/^node\s+(.+)$/);
      if (!match) {
        rewrittenEntries.push(shallowCopy(entry));
        continue;
      }
      const scriptPath = match[1].trim().replace(/^\.\//, '');
      const absoluteScript = path.join(installRoot, scriptPath);
      const newCommand = `node ${JSON.stringify(absoluteScript)}`;
      rewrittenEntries.push(copyObjectReplaceKey(entry, 'command', newCommand));
    }
    result[eventName] = rewrittenEntries;
  }

  const fragment = { version: config.version || 1, hooks: result };
  return fragment;
}

function mergeClaudeHooks(existingHooks, fragment) {
  const merged = shallowCopy(existingHooks);

  for (const [eventName, newGroups] of Object.entries(fragment)) {
    const previousGroups = merged[eventName] || [];
    const keptGroups = [];

    for (const group of previousGroups) {
      const keptHooks = [];
      for (const hook of group.hooks || []) {
        if (!isClaudeFormsHook(hook)) {
          keptHooks.push(hook);
        }
      }
      if (keptHooks.length > 0) {
        keptGroups.push(copyObjectReplaceKey(group, 'hooks', keptHooks));
      }
    }

    merged[eventName] = keptGroups.concat(newGroups);
  }

  return merged;
}

function mergeCursorHooks(existingConfig, fragment) {
  const version = existingConfig.version || fragment.version || 1;
  const mergedHooks = shallowCopy(existingConfig.hooks || {});

  for (const [eventName, newEntries] of Object.entries(fragment.hooks)) {
    const previousEntries = mergedHooks[eventName] || [];
    const keptEntries = [];
    for (const entry of previousEntries) {
      if (!isClaudeFormsHook(entry)) {
        keptEntries.push(entry);
      }
    }
    mergedHooks[eventName] = keptEntries.concat(newEntries);
  }

  // Drop orphaned stop entries from older installs (Cursor stop forces a turn).
  if (mergedHooks.stop) {
    const keptStop = [];
    for (const entry of mergedHooks.stop) {
      if (!isClaudeFormsHook(entry)) {
        keptStop.push(entry);
      }
    }
    if (keptStop.length === 0) {
      delete mergedHooks.stop;
    } else {
      mergedHooks.stop = keptStop;
    }
  }

  const result = shallowCopy(existingConfig);
  result.version = version;
  result.hooks = mergedHooks;
  return result;
}

function stripClaudeHooks(hooks) {
  const result = {};

  for (const [eventName, groups] of Object.entries(hooks || {})) {
    const keptGroups = [];
    for (const group of groups || []) {
      const keptHooks = [];
      for (const hook of group.hooks || []) {
        if (!isClaudeFormsHook(hook)) {
          keptHooks.push(hook);
        }
      }
      if (keptHooks.length > 0) {
        keptGroups.push(copyObjectReplaceKey(group, 'hooks', keptHooks));
      }
    }
    if (keptGroups.length > 0) {
      result[eventName] = keptGroups;
    }
  }

  return result;
}

function stripCursorHooks(config) {
  const keptHooks = {};
  for (const [eventName, entries] of Object.entries(config.hooks || {})) {
    const keptEntries = [];
    for (const entry of entries || []) {
      if (!isClaudeFormsHook(entry)) {
        keptEntries.push(entry);
      }
    }
    if (keptEntries.length > 0) {
      keptHooks[eventName] = keptEntries;
    }
  }
  const result = shallowCopy(config);
  result.hooks = keptHooks;
  return result;
}

module.exports = {
  readJsonFile,
  isClaudeFormsHook,
  claudeHookFragment,
  cursorHookFragment,
  mergeClaudeHooks,
  mergeCursorHooks,
  stripClaudeHooks,
  stripCursorHooks,
};
