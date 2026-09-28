const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs'),
  os = require('node:os'),
  path = require('node:path');
const { setup, CLAUDE_BLOCK } = require('../app/claude-setup.cjs');
function fixture() {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'as-claude-test-'));
  return {
    home,
    files: {
      dir: path.join(home, '.claude'),
      config: path.join(home, '.claude.json'),
      instructions: path.join(home, '.claude', 'CLAUDE.md'),
    },
  };
}
const node = { command: '/usr/local/bin/node', env: {} };
test('Claude Code registration keeps other settings and is idempotent', async () => {
  const { home, files } = fixture();
  fs.writeFileSync(
    files.config,
    JSON.stringify({
      theme: 'dark',
      mcpServers: { other: { type: 'stdio', command: 'x' } },
      projects: { a: 1 },
    }),
  );
  const root = path.join(home, 'App With Spaces');
  const first = await setup({ root, files, node });
  assert.equal(first.changed, true);
  const cfg = JSON.parse(fs.readFileSync(files.config, 'utf8'));
  assert.equal(cfg.theme, 'dark');
  assert.deepEqual(cfg.projects, { a: 1 });
  assert.deepEqual(cfg.mcpServers.other, { type: 'stdio', command: 'x' });
  assert.deepEqual(cfg.mcpServers['agent-browser'].args, [path.join(root, 'browser-mcp.mjs')]);
  assert.equal(cfg.mcpServers['agent-browser'].command, node.command);
  assert.ok(fs.existsSync(files.config + '.agent-spaces-backup'));
  const second = await setup({ root, files, node });
  assert.equal(second.changed, false);
  assert.match(fs.readFileSync(files.instructions, 'utf8'), /agent-spaces:browser-default:start/);
});
test('Claude Code preference block preserves existing CLAUDE.md and disables cleanly', async () => {
  const { home, files } = fixture();
  fs.mkdirSync(files.dir);
  fs.writeFileSync(files.instructions, '# Mine\nKeep this.\n');
  await setup({ root: home, files, node });
  const on = fs.readFileSync(files.instructions, 'utf8');
  assert.ok(on.startsWith('# Mine\nKeep this.\n'));
  assert.match(on, /new Claude Code session/);
  assert.doesNotMatch(CLAUDE_BLOCK, /Codex restarted/);
  await setup({ root: home, files, node, enabled: false });
  assert.equal(fs.readFileSync(files.instructions, 'utf8').trim(), '# Mine\nKeep this.');
  assert.ok(
    JSON.parse(fs.readFileSync(files.config, 'utf8')).mcpServers['agent-browser'],
    'disabling the preference keeps the connector',
  );
});
test('unreadable Claude Code settings are never overwritten', async () => {
  const { home, files } = fixture();
  fs.writeFileSync(files.config, '{not json');
  await assert.rejects(setup({ root: home, files, node }), /could not be read/);
  assert.equal(fs.readFileSync(files.config, 'utf8'), '{not json');
});
