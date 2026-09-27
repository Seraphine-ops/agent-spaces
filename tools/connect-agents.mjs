// Registers the Agent Spaces browser connector with every installed agent app (Codex, Claude Code).
// The app does the same on launch; setup scripts call this so tools are ready before first use.
import {createRequire} from 'node:module';import path from 'node:path';import {fileURLToPath} from 'node:url';
const require=createRequire(import.meta.url);
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const targets=[['Codex',require('../app/codex-setup.cjs')],['Claude Code',require('../app/claude-setup.cjs')]];
let connected=0;
for(const [name,mod] of targets){
 if(!mod.installed()){console.log(`${name}: not found, skipped.`);continue;}
 try{await mod.setup({root,enabled:true});connected++;console.log(`${name}: connected. Restart it or start a new session to load the browser tools.`);}
 catch(e){console.log(`${name}: ${e.message}`);}
}
if(!connected){console.log('No agent app was connected. Install Codex or Claude Code, then run this again: node tools/connect-agents.mjs');process.exitCode=1;}
