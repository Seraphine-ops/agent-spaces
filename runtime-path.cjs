const path = require('node:path');
const os = require('node:os');
// Shared by the app and its Node.js MCP process. Never uses a source checkout for user data.
function dataDirectory() {
  if (process.env.AGENT_SPACES_DATA) return process.env.AGENT_SPACES_DATA;
  if (process.platform === 'darwin')
    return path.join(os.homedir(), 'Library', 'Application Support', 'Agent Spaces');
  return path.join(
    process.env.LOCALAPPDATA || path.join(os.homedir(), 'AppData', 'Local'),
    'Agent Spaces Browser',
  );
}
module.exports = { dataDirectory };
