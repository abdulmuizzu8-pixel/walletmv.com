# Claude Code setup for WalletMV

Based on the official setup guide: https://code.claude.com/docs/en/setup
Services included: VS Code, GitHub, Vercel, Expo / EAS.

## 1. Check requirements

- macOS 13+, Windows 10 1809+, Ubuntu 20.04+, Debian 10+ or Alpine 3.19+; 4 GB+ RAM.
- A Claude Pro, Max, Team, Enterprise or Console account (the free plan does not include Claude Code).
- Node.js 22+ for this project (`node -v`).

## 2. Install Claude Code

| System | Command |
| --- | --- |
| macOS, Linux, WSL | `curl -fsSL https://claude.ai/install.sh \| bash` |
| Windows PowerShell | `irm https://claude.ai/install.ps1 \| iex` |
| Windows CMD | `curl -fsSL https://claude.ai/install.cmd -o install.cmd && install.cmd && del install.cmd` |
| Homebrew | `brew install --cask claude-code` |
| WinGet | `winget install Anthropic.ClaudeCode` |
| npm | `npm install -g @anthropic-ai/claude-code` (never with `sudo`) |

On native Windows, installing [Git for Windows](https://git-scm.com/downloads/win) lets Claude Code use Bash.
The native installer auto-updates; Homebrew and WinGet need `brew upgrade claude-code` / `winget upgrade Anthropic.ClaudeCode`.

## 3. Verify and sign in

```bash
claude --version   # prints a version, e.g. 2.1.x (Claude Code)
claude doctor      # install health, settings validation, update status
```

Open a new terminal in the project and run `claude`, then follow the browser login.

## 4. Get the project

```bash
git clone https://github.com/abdulmuizzu8-pixel/LAARI.git walletmv
cd walletmv
npm install
npm test && npm run typecheck && npm run lint
```

## 5. Connect the services

The project already ships the config; you only sign in.

### VS Code

1. Open the folder in VS Code. Accept the prompt to install the recommended extensions
   (Claude Code, Expo Tools, ESLint), or install them from the Extensions view.
2. Open Claude Code from the editor's Spark icon or run `claude` in the integrated terminal.

### GitHub

1. Create a fine-grained personal access token at https://github.com/settings/personal-access-tokens
   with access to `LAARI` and `walletmv` (Contents, Issues, Pull requests: read and write).
2. Make it available to Claude Code without committing it:
   ```bash
   export GITHUB_PERSONAL_ACCESS_TOKEN=github_pat_...   # add to ~/.zshrc or ~/.bashrc
   ```
3. Start `claude`, approve the project's `github` MCP server when asked, and check it with `/mcp`.

### Vercel

1. Start `claude`, approve the `vercel` MCP server, run `/mcp` and sign in to Vercel (OAuth).
2. To host the web build, import the repo at https://vercel.com/new. `vercel.json` already sets
   the build command (`npx expo export --platform web`) and output folder (`dist`).

### Expo / EAS

1. The Expo plugin is enabled in `.claude/settings.json`; Claude Code offers to install it when you
   trust the project. Or install it yourself:
   `claude plugin install expo@claude-plugins-official --scope project`
2. Run `/mcp` and sign in to your Expo account.
3. Link the app to EAS once (adds the project ID to `app.json`):
   ```bash
   npx eas-cli@latest login
   npx eas-cli@latest init
   ```
4. Builds use the profiles in `eas.json`:
   - `npx eas-cli@latest build --profile preview --platform android` – installable APK for testers
   - `npx eas-cli@latest build --profile production` – store builds
   - `development` needs `npx expo install expo-dev-client` first.

## 6. Cloud sessions (claude.ai/code)

`.claude/hooks/session-start.sh` runs at the start of every cloud session and installs
dependencies, so `npm test`, `npm run typecheck` and `npm run lint` work straight away.
It does nothing on your own machine.

## Files in this setup

| File | Purpose |
| --- | --- |
| `CLAUDE.md` | Project instructions Claude reads every session |
| `.claude/settings.json` | Expo plugin, allowed commands, `.env` read block, MCP servers, startup hook |
| `.claude/hooks/session-start.sh` | Installs dependencies in cloud sessions |
| `.mcp.json` | GitHub and Vercel MCP servers (shared with the team) |
| `.vscode/extensions.json`, `.vscode/settings.json` | Recommended extensions, ESLint fix on save |
| `vercel.json` | Vercel build for the Expo web export |
| `eas.json` | EAS build and submit profiles |
| `eslint.config.js` | Lint rules (`eslint-config-expo`) |

## Updating and uninstalling Claude Code

- Update now: `claude update`. Use the stable channel with `"autoUpdatesChannel": "stable"` in settings.
- Uninstall (native): `rm -f ~/.local/bin/claude && rm -rf ~/.local/share/claude`.
- Remove this project's Claude config: delete `.claude/` and `.mcp.json`.
