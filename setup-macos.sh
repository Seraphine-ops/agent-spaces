#!/bin/sh
set -eu

ROOT=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
# Codex's desktop app ships a Node.js runtime; use it when Node.js is not installed.
CODEX_NODE_DIR=/Applications/ChatGPT.app/Contents/Resources/cua_node/bin
NODE_BIN=$(command -v node || true)
if [ -z "$NODE_BIN" ] && [ -x "$CODEX_NODE_DIR/node" ]; then
  NODE_BIN="$CODEX_NODE_DIR/node"
fi
if [ -z "$NODE_BIN" ]; then
  echo "Install Node.js 22 or later (https://nodejs.org), then run this setup again."
  exit 1
fi
NODE_MAJOR=$("$NODE_BIN" -p 'process.versions.node.split(".")[0]')
if [ "$NODE_MAJOR" -lt 22 ]; then
  echo "Upgrade Node.js to version 22 or later, then run this setup again."
  exit 1
fi

export PATH="$(dirname "$NODE_BIN"):$PATH"
export AGENT_SPACES_CONNECTOR_ROOT="$ROOT"
TMP_ROOT=${TMPDIR:-/private/tmp}
export npm_config_cache="$TMP_ROOT/agent-spaces-npm-cache"
mkdir -p "$npm_config_cache"

echo "Installing locked application dependencies..."
if command -v npm >/dev/null 2>&1; then
  npm ci --ignore-scripts
elif [ -x "$CODEX_NODE_DIR/corepack" ]; then
  COREPACK_HOME="$TMP_ROOT/agent-spaces-corepack" "$CODEX_NODE_DIR/corepack" npm ci --ignore-scripts
  COREPACK_BIN_DIR="$TMP_ROOT/agent-spaces-bin"
  mkdir -p "$COREPACK_BIN_DIR"
  COREPACK_HOME="$TMP_ROOT/agent-spaces-corepack" "$CODEX_NODE_DIR/corepack" enable npm --install-directory "$COREPACK_BIN_DIR"
  PATH="$COREPACK_BIN_DIR:$PATH"
  export PATH
else
  echo "npm was not found. Install Node.js 22 or later with npm, then run this setup again."
  exit 1
fi

case "$(uname -m)" in
  arm64) ELECTRON_ARCH=arm64 ;;
  x86_64) ELECTRON_ARCH=x64 ;;
  *) echo "Unsupported Mac architecture: $(uname -m)"; exit 1 ;;
esac
echo "Downloading Electron..."
mkdir -p "$ROOT/node_modules/electron/dist"
ELECTRON_VERSION=$("$NODE_BIN" -p "require('$ROOT/node_modules/electron/package.json').version")
ZIP="$TMP_ROOT/agent-spaces-electron-$ELECTRON_VERSION-$ELECTRON_ARCH.zip"
curl -fL "https://github.com/electron/electron/releases/download/v$ELECTRON_VERSION/electron-v$ELECTRON_VERSION-darwin-$ELECTRON_ARCH.zip" -o "$ZIP"
ditto -x -k "$ZIP" "$ROOT/node_modules/electron/dist"
printf '%s' 'Electron.app/Contents/MacOS/Electron' > "$ROOT/node_modules/electron/path.txt"

echo "Building Agent Spaces Browser.app..."
ELECTRON_BUILDER_CACHE="$TMP_ROOT/agent-spaces-builder-cache" npm run dist:mac -- --"$ELECTRON_ARCH"
APP_BUNDLE="$ROOT/dist/mac-$ELECTRON_ARCH/Agent Spaces Browser.app"
codesign --force --deep --sign - "$APP_BUNDLE"

echo "Connecting agent apps..."
"$NODE_BIN" "$ROOT/tools/connect-agents.mjs" || true
echo "Setup complete. The browser opens when an agent starts its first browser task."
