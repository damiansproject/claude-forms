'use strict';

/**
 * Read all stdin as a string.
 * @returns {Promise<string>}
 */
function readStdin() {
  return new Promise((resolve, reject) => {
    const chunks = [];
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (c) => chunks.push(c));
    process.stdin.on('end', () => resolve(chunks.join('')));
    process.stdin.on('error', reject);
  });
}

/**
 * @param {string} raw
 * @returns {object}
 */
function parseInput(raw) {
  try {
    return JSON.parse(raw || '{}');
  } catch {
    return {};
  }
}

/**
 * @param {object} obj
 */
function writeJson(obj) {
  process.stdout.write(JSON.stringify(obj));
}

/**
 * Claude Code PreToolUse deny.
 * @param {string} reason
 * @param {string} [additionalContext]
 */
function claudeDeny(reason, additionalContext) {
  const out = {
    hookSpecificOutput: {
      hookEventName: 'PreToolUse',
      permissionDecision: 'deny',
      permissionDecisionReason: reason,
    },
  };
  if (additionalContext) {
    out.hookSpecificOutput.additionalContext = additionalContext;
  }
  writeJson(out);
}

/**
 * Claude Code context-only (SessionStart, UserPromptSubmit, PostToolUse, Stop).
 * @param {string} eventName
 * @param {string} additionalContext
 * @param {object} [extra]
 */
function claudeContext(eventName, additionalContext, extra = {}) {
  writeJson({
    ...extra,
    hookSpecificOutput: {
      hookEventName: eventName,
      additionalContext,
      ...(extra.hookSpecificOutput || {}),
    },
  });
}

/**
 * Cursor preToolUse deny.
 * @param {string} reason
 */
function cursorDeny(reason) {
  writeJson({
    permission: 'deny',
    agent_message: reason,
    user_message: reason,
  });
}

/**
 * Claude Code sends session_id; Cursor sends conversation_id (stable across turns).
 * @param {object} input
 * @returns {string}
 */
function sessionId(input) {
  return (
    input.session_id ||
    input.sessionId ||
    input.conversation_id ||
    process.env.CLAUDE_FORM_SESSION_ID ||
    'default'
  );
}

/**
 * @param {object} input
 * @returns {string}
 */
function filePathFromTool(input) {
  const ti = input.tool_input || input.toolInput || input.arguments || {};
  return ti.file_path || ti.filePath || ti.path || '';
}

module.exports = {
  readStdin,
  parseInput,
  writeJson,
  claudeDeny,
  claudeContext,
  cursorDeny,
  sessionId,
  filePathFromTool,
};
