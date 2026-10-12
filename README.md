# WalletMV (mobile)

MVR-first personal finance app for the Maldives, built with React Native (Expo SDK 57, TypeScript).
Companion to the WalletMV web dashboard.

## MVP features

- **Home** – total balance, this month's income/spending, daily *safe-to-spend* after unpaid bills, upcoming bills, budgets, recent activity.
- **Add transaction** – expense or income in **MVR or USD**. USD entries store the rate you actually paid
  (MMA official 15.42 or your own parallel-market rate) and are converted to MVR for all totals.
- **Maldives categories & payment methods** – STELCO/FENAKA/MWSC, Dhiraagu/Ooredoo, ferry, rent, loan EMI, family support,
  remittance abroad, Zakat & Sadaqah; Cash, BML/MIB card, Favara, BML Pay, DhiraaguPay, m-Faisaa.
- **Activity** – per-month list and top spending categories; long-press to delete.
- **Budgets** – monthly limit per category with progress and over-budget warnings.
- **Bills** – recurring monthly bills with due/overdue status; *Mark paid* logs the expense.
- **Settings** – default USD rate, opening balance, load sample data, erase data.

Data is stored on the device only (AsyncStorage). Amounts are kept as integer laari (1 MVR = 100 laari).

## Run

```bash
npm install
npm start          # scan the QR code with Expo Go, or press a (Android) / i (iOS) / w (web)
npm run web        # browser
```

## Checks

```bash
npm test           # finance logic unit tests (node:test)
npm run typecheck  # tsc --noEmit
npm run lint       # expo lint
```

Add native packages with `npx expo install <package>` so versions match the Expo SDK.

## Project layout

```
App.tsx                      app shell: header, tab bar, add-transaction sheet
src/lib/finance.ts           pure money logic (parsing, MVR/USD, budgets, bills, safe-to-spend, demo data)
src/lib/finance.test.ts      unit tests
src/store.tsx                reducer + AsyncStorage persistence
src/ui.tsx                   shared components and theme
src/screens/                 Home, Activity, Budgets, Bills, Settings
src/components/              AddTransaction form, TransactionRow
docs/maldives-market-research.md   market research behind the MVP scope
```
