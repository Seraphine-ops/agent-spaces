const fs=require('node:fs');const path=require('node:path');const os=require('node:os');
const {merge,BLOCK}=require('./codex-setup.cjs');
// Same routing preference as Codex, worded for Claude Code.
const CLAUDE_BLOCK=BLOCK.replace('Agent Spaces must be opened or Codex restarted to load the connector','Agent Spaces must be opened or a new Claude Code session started to load the connector');
function executable(name){for(const dir of (process.env.PATH||'').split(path.delimiter)){const p=path.join(dir,name);if(fs.existsSync(p))return p;}return null;}
function paths(){
 const dir=process.env.CLAUDE_CONFIG_DIR||path.join(os.homedir(),'.claude');
 // Claude Code keeps user-scope MCP servers in ~/.claude.json (or <CLAUDE_CONFIG_DIR>/.claude.json).
 const config=process.env.CLAUDE_CONFIG_DIR?path.join(dir,'.claude.json'):path.join(os.homedir(),'.claude.json');
 return {dir,config,instructions:path.join(dir,'CLAUDE.md')};
}
function installed(){const p=paths();return fs.existsSync(p.config)||fs.existsSync(p.dir)||!!executable(process.platform==='win32'?'claude.exe':'claude')||!!executable('claude.cmd');}
// Prefer a real Node.js; otherwise run the connector with Electron's built-in Node.
function nodeCommand(){
 const node=process.env.AGENT_SPACES_NODE||executable(process.platform==='win32'?'node.exe':'node');
 if(node)return {command:node,env:{}};
 const bundled='/Applications/ChatGPT.app/Contents/Resources/cua_node/bin/node';
 if(process.platform==='darwin'&&fs.existsSync(bundled))return {command:bundled,env:{}};
 if(process.versions.electron)return {command:process.execPath,env:{ELECTRON_RUN_AS_NODE:'1'}};
 throw Error('Node.js 22 or later was not found. Install Node.js, then reopen Agent Spaces.');
}
function writeAtomic(file,text){fs.mkdirSync(path.dirname(file),{recursive:true});const tmp=file+'.agent-spaces-tmp';fs.writeFileSync(tmp,text,{mode:0o600});fs.renameSync(tmp,file);}
async function setup({root,enabled=true,files=paths(),node}={}){
 let changed=false;
 if(enabled){
  const run=node||nodeCommand();
  const env={...run.env,...(process.env.AGENT_SPACES_DATA?{AGENT_SPACES_DATA:process.env.AGENT_SPACES_DATA}:{})};
  const entry={type:'stdio',command:run.command,args:[path.join(root,'browser-mcp.mjs')],env};
  let text='';try{text=fs.readFileSync(files.config,'utf8');}catch{}
  let config={};if(text.trim()){try{config=JSON.parse(text);}catch{throw Error('Claude Code settings could not be read. Check ~/.claude.json, then retry.');}}
  if(JSON.stringify(config.mcpServers?.['agent-browser'])!==JSON.stringify(entry)){
   if(text)fs.copyFileSync(files.config,files.config+'.agent-spaces-backup');
   config.mcpServers={...(config.mcpServers||{}),'agent-browser':entry};
   writeAtomic(files.config,JSON.stringify(config,null,2));changed=true;
  }
 }
 const before=fs.existsSync(files.instructions)?fs.readFileSync(files.instructions,'utf8'):'';const after=merge(before,enabled,CLAUDE_BLOCK);
 if(before!==after){if(before)fs.copyFileSync(files.instructions,files.instructions+'.agent-spaces-backup-'+Date.now());writeAtomic(files.instructions,after);changed=true;}
 return {enabled,changed,instructionsFile:files.instructions,message:enabled?'Browser preference saved. Start a new Claude Code session to load it.':'Browser preference disabled. The connector remains available.'};
}
module.exports={setup,installed,paths,CLAUDE_BLOCK};
