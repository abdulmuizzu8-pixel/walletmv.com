# WalletMV mobile

MVR-first personal finance app for the Maldives. React Native + Expo SDK 57, TypeScript.
Expo-specific rules (versioned docs, `npx expo install`, EAS) are in @AGENTS.md.

## Commands

```bash
npm test           # finance logic unit tests (node:test, src/**/*.test.ts)
npm run typecheck  # tsc --noEmit
npm run lint       # expo lint (ESLint, eslint-config-expo)
npm start          # Expo dev server (Expo Go / a / i / w)
```

Run test, typecheck and lint before calling a task done.

## Code map

- `App.tsx` – app shell: header, bottom tabs (plain state, not Expo Router yet), add-transaction sheet.
- `src/lib/finance.ts` – all money logic as pure functions. Amounts are **integer laari** (1 MVR = 100 laari).
  USD transactions store the rate actually paid; totals always use the converted `mvr` field.
- `src/store.tsx` – reducer + AsyncStorage persistence (`walletmv/state/v1`).
- `src/screens/*`, `src/components/*`, `src/ui.tsx` – screens, shared components and theme.
- `docs/maldives-market-research.md` – why the MVP has the features it has.

## Conventions

- New money logic goes in `finance.ts` with a test in `finance.test.ts`; screens stay thin.
- Use `confirm()` from `src/ui.tsx` for destructive actions (works on web and native).
- Maldives-specific copy: MVR first, Favara / BML Pay / DhiraaguPay / m-Faisaa as payment methods,
  STELCO / FENAKA / MWSC / Dhiraagu / Ooredoo as billers.

## Services

| Service | How it is wired | Notes |
| --- | --- | --- |
| VS Code | `.vscode/extensions.json` recommends the Claude Code, Expo Tools and ESLint extensions | |
| GitHub | `github` server in `.mcp.json` | needs `GITHUB_PERSONAL_ACCESS_TOKEN` in your environment |
| Vercel | `vercel` server in `.mcp.json`; `vercel.json` deploys the Expo web build (`dist/`) | sign in with `/mcp` |
| Expo / EAS | Expo plugin enabled in `.claude/settings.json` (Expo skills + Expo MCP); `eas.json` build profiles | sign in with `/mcp`; run `npx eas-cli@latest init` once |

Full setup steps: `docs/claude-code-setup.md`.
