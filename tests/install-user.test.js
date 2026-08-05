'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const test = require('node:test');

const ROOT = path.join(__dirname, '..');

test('user install can be removed and purged', () => {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'claude-forms-install-'));
  const installRoot = path.join(home, 'runtime');
  const env = {
    ...process.env,
    HOME: home,
    USERPROFILE: home,
    CLAUDE_FORM_INSTALL_DIR: installRoot,
  };

  try {
    let result = spawnSync('node', ['scripts/install-user.js'], {
      cwd: ROOT,
      env,
      encoding: 'utf8',
    });
    assert.equal(result.status, 0, result.stderr);
    assert.equal(fs.existsSync(path.join(home, '.claude', 'rules', 'no-overengineer.md')), true);
    assert.equal(fs.existsSync(path.join(home, '.cursor', 'rules', 'no-overengineer.mdc')), true);
    assert.equal(fs.existsSync(path.join(home, '.claude', 'skills', 'prompt-general')), true);
    assert.equal(fs.existsSync(path.join(home, '.cursor', 'skills', 'prompt-general')), true);

    result = spawnSync('node', ['scripts/uninstall-user.js'], {
      cwd: ROOT,
      env,
      encoding: 'utf8',
    });
    assert.equal(result.status, 0, result.stderr);
    assert.equal(fs.existsSync(path.join(home, '.claude', 'rules', 'no-overengineer.md')), false);
    assert.equal(fs.existsSync(path.join(home, '.cursor', 'rules', 'no-overengineer.mdc')), false);
    assert.equal(fs.existsSync(path.join(home, '.claude', 'skills', 'prompt-general')), false);
    assert.equal(fs.existsSync(path.join(home, '.cursor', 'skills', 'prompt-general')), false);
    assert.equal(fs.existsSync(installRoot), true);

    result = spawnSync('node', ['scripts/uninstall-user.js', '--purge'], {
      cwd: ROOT,
      env,
      encoding: 'utf8',
    });
    assert.equal(result.status, 0, result.stderr);
    assert.equal(fs.existsSync(installRoot), false);
  } finally {
    fs.rmSync(home, { recursive: true, force: true });
  }
});
