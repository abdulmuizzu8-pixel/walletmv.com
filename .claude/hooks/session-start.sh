#!/bin/bash
# Installs WalletMV dependencies at the start of Claude Code cloud sessions so
# tests (npm test), typecheck and lint work immediately.
set -euo pipefail

# Local machines manage their own node_modules.
if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

cd "${CLAUDE_PROJECT_DIR:-.}"

# npm install (not ci) so the cached container keeps node_modules between sessions.
npm install --no-audit --no-fund

# Expo CLI otherwise tries to reach api.expo.dev for version checks, which may be blocked.
if [ -n "${CLAUDE_ENV_FILE:-}" ]; then
  grep -q 'EXPO_OFFLINE' "$CLAUDE_ENV_FILE" 2>/dev/null || echo 'export EXPO_OFFLINE=1' >> "$CLAUDE_ENV_FILE"
fi
