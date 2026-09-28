<img src="app/ui/logo.svg" width="84" alt="Agent Spaces logo">

# Agent Spaces

[![CI](https://github.com/Seraphine-ops/agent-spaces/actions/workflows/ci.yml/badge.svg)](https://github.com/Seraphine-ops/agent-spaces/actions/workflows/ci.yml)

I built Agent Spaces because I wanted agents to have their own home on my laptop. Their browser work interrupted mine, and their activity felt scattered across chats, tabs and apps. I wanted somewhere I could see what they were doing, which accounts they were using, and what needed my attention, separate from my personal workspace.

Agent Spaces has a built-in browser that connects directly to Codex and Claude Code. Once connected, your agent uses it automatically for browser tasks. You keep prompting in the same Codex task or Claude Code session, with its conversation context intact. Crucially, agents don’t need to take over your screen or mouse: they work in their own browser tabs while you use your computer normally.

Here’s what it adds around your agent:

- **Separation:** agents browse independently without interrupting your personal workspace.
- **Accounts:** agents create accounts or use yours, saving and reusing logins across tasks.
- **Verification:** agents independently use saved email inboxes to retrieve codes, follow links and complete supported signups.
- **Alerts:** desktop notifications take you straight to the tab needing input, even while you’re using another app.
- **Handoff:** take control, complete the human step and quickly return control with the session intact.
- **Concurrent work:** different agents work in separate tabs.
- **Visibility:** tabs and searchable history keep agent activity visible.

For example, one agent can create and save an email account. Another can use it to register elsewhere, open the inbox, complete email verification, and save the new login. It can then work inside that account, and future agents can pick up using the saved login.

The GitHub account hosting this project was created through Agent Spaces using that workflow: an agent created the email account, another used it to create and verify the GitHub account, and its credentials were saved for subsequent work.

Some agent products offer overlapping features. Agent Spaces brings these capabilities together in one workspace you can see and manage.

This release supports **Windows x64 and macOS (Apple Silicon and Intel)**, **Codex and Claude Code**, and **browser tasks**. Setup connects whichever of Codex and Claude Code you have installed, or both. I also have prototypes that extend Agent Spaces to desktop apps running inside a virtual machine, so agents can work there without taking over your personal desktop. I’m working toward Linux support. Those capabilities are not included in this release.

### Windows setup

Clone the repository and run the setup launcher:

```powershell
git clone https://github.com/Seraphine-ops/agent-spaces.git
cd agent-spaces
& '.\Setup Agent Spaces.cmd'
```

Alternatively, download the source ZIP, extract it, and double-click **Setup Agent Spaces.cmd**. Setup installs missing prerequisites, builds the browser workspace and opens Agent Spaces. Windows may ask for installation permission. On first launch, Agent Spaces registers its browser connector and browser preference with Codex and Claude Code, whichever are installed. Restart Codex, or start a new Claude Code session, so it loads the tools. If neither is installed, setup installs the Codex CLI.

### macOS setup

You need Node.js 22 or later (the Codex desktop app’s bundled Node.js also works). Clone or download the repository, then run:

```sh
git clone https://github.com/Seraphine-ops/agent-spaces.git
cd agent-spaces
./setup-macos.sh
```

Setup installs the locked dependencies, builds a local **Agent Spaces Browser.app**, and connects Codex and/or Claude Code. Restart Codex, or start a new Claude Code session, to load the tools. The browser opens when an agent starts its first browser task. Its profile and encrypted account data live in `~/Library/Application Support/Agent Spaces`. The WebView2 engine is Windows-only; macOS uses the embedded Chromium engine.

To reconnect later (for example after installing Claude Code), run `node tools/connect-agents.mjs` from the project folder.

### What connecting changes

- **Codex:** adds the `agent-browser` MCP server with `codex mcp add`, and a marked section in `~/.codex/AGENTS.md` that makes Agent Spaces the default browser.
- **Claude Code:** adds the `agent-browser` MCP server to `~/.claude.json` (user scope, so every project sees it) and the same marked section in `~/.claude/CLAUDE.md`. Existing settings and instructions are kept, and a backup is written before any change.

Turning off **Use AS for browser tasks** in settings removes the marked sections and leaves the connector installed.

**Take control** pauses agent input for one tab. **Return to agent** lets a task that is still running and waiting continue from the updated page. **Pause browser agents** pauses the entire browser workspace, including new tasks, until you resume it. Closing the window keeps Agent Spaces running in the system tray (menu bar on macOS); **Quit runtime** stops it.

Saved credentials are encrypted locally using Windows-backed storage on Windows and the macOS Keychain on Mac. Logins you complete yourself, including single sign-on logins that return you to another site (for example Microsoft or Google sign-in for a university or work account), are offered for saving once they succeed. Connected agents can retrieve them, and information requested by an agent may enter its model provider’s context. Tabs within the same browser engine share website sessions; they are not separate account containers. Agent Spaces does not restrict your agent’s other computer tools. Some websites and verification methods still require human help.

For technical details, see [SECURITY.md](SECURITY.md), [PRIVACY.md](PRIVACY.md), [SECURITY-REVIEW.md](SECURITY-REVIEW.md), [CONTRIBUTING.md](CONTRIBUTING.md) and [ARCHITECTURE.md](ARCHITECTURE.md).

MIT licensed.
