'use strict';

// Stdin/stdout adapters for the Claude Code and Cursor hook protocols.
function readStdin() {
  return new Promise((resolve, reject) => {
    const chunks = [];
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (chunk) => chunks.push(chunk));
    process.stdin.on('end', () => resolve(chunks.join('')));
    process.stdin.on('error', reject);
  });
}

function parseInput(raw) {
  try {
    return JSON.parse(raw || '{}');
  } catch {
    return {};
  }
}

function writeJson(obj) {
  process.stdout.write(JSON.stringify(obj));
}

function claudeDeny(reason) {
  writeJson({
    hookSpecificOutput: {
      hookEventName: 'PreToolUse',
      permissionDecision: 'deny',
      permissionDecisionReason: reason,
    },
  });
}

function claudeContext(eventName, additionalContext) {
  writeJson({
    hookSpecificOutput: {
      hookEventName: eventName,
      additionalContext,
    },
  });
}

function cursorDeny(reason) {
  writeJson({
    permission: 'deny',
    agent_message: reason,
    user_message: reason,
  });
}

function sessionId(input) {
  // Claude Code sends session_id; Cursor sends conversation_id.
  if (input.session_id) {
    return input.session_id;
  }
  if (input.sessionId) {
    return input.sessionId;
  }
  if (input.conversation_id) {
    return input.conversation_id;
  }
  if (process.env.CLAUDE_FORM_SESSION_ID) {
    return process.env.CLAUDE_FORM_SESSION_ID;
  }
  return 'default';
}

function filePathFromTool(input) {
  const toolInput = input.tool_input || input.toolInput || input.arguments || {};
  if (toolInput.file_path) {
    return toolInput.file_path;
  }
  if (toolInput.filePath) {
    return toolInput.filePath;
  }
  if (toolInput.path) {
    return toolInput.path;
  }
  return '';
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
