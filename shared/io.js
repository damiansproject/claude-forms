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
 * Claude Code PreToolUse allow + optional context.
 * @param {string} [additionalContext]
 * @param {string} [reason]
 */
function claudeAllow(additionalContext, reason) {
  const hso = {
    hookEventName: 'PreToolUse',
    permissionDecision: 'allow',
  };
  if (reason) hso.permissionDecisionReason = reason;
  if (additionalContext) hso.additionalContext = additionalContext;
  writeJson({ hookSpecificOutput: hso });
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
 * Cursor allow with optional agent message / context.
 * @param {object} opts
 */
function cursorAllow(opts = {}) {
  const out = { permission: 'allow' };
  if (opts.agent_message) out.agent_message = opts.agent_message;
  if (opts.user_message) out.user_message = opts.user_message;
  if (opts.additional_context) out.additional_context = opts.additional_context;
  writeJson(out);
}

/**
 * @param {object} input
 * @returns {string}
 */
function sessionId(input) {
  return input.session_id || input.sessionId || process.env.CLAUDE_FORM_SESSION_ID || 'default';
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
  claudeAllow,
  claudeContext,
  cursorDeny,
  cursorAllow,
  sessionId,
  filePathFromTool,
};
