import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  balance,
  billStatus,
  budgetProgress,
  demoState,
  emptyState,
  formatMoney,
  isValidISODate,
  makeTransaction,
  monthSummary,
  parseAmount,
  parseSavedState,
  safeToSpend,
  toMVR,
  unpaidBills,
  type State,
} from './finance.ts';

const oct10 = new Date(2026, 9, 10);

test('parseAmount accepts commas and up to two decimals', () => {
  assert.equal(parseAmount('1,250.5'), 125050);
  assert.equal(parseAmount('42'), 4200);
  assert.equal(parseAmount('0'), null);
  assert.equal(parseAmount('1.234'), null);
  assert.equal(parseAmount('abc'), null);
  assert.equal(parseAmount('-5'), null);
});

test('formatMoney groups thousands and hides zero laari', () => {
  assert.equal(formatMoney(123450), 'MVR 1,234.50');
  assert.equal(formatMoney(120000), 'MVR 1,200');
  assert.equal(formatMoney(-505), '-MVR 5.05');
  assert.equal(formatMoney(4000, 'USD'), 'USD 40');
});

test('toMVR converts USD with the given rate', () => {
  assert.equal(toMVR(4000, 'USD', 15.42), 61680);
  assert.equal(toMVR(4000, 'USD', 22.1), 88400);
  assert.equal(toMVR(4000, 'MVR', 15.42), 4000);
});

test('isValidISODate rejects impossible dates', () => {
  assert.ok(isValidISODate('2026-02-28'));
  assert.ok(!isValidISODate('2026-02-30'));
  assert.ok(!isValidISODate('2026-2-3'));
});

function sampleState(): State {
  const s = emptyState();
  s.settings.startingBalance = 100000;
  const base = { currency: 'MVR' as const, rate: 1, method: 'Cash', note: '' };
  s.transactions = [
    makeTransaction({ ...base, type: 'income', amount: 1000000, categoryId: 'salary', date: '2026-10-01' }),
    makeTransaction({ ...base, type: 'expense', amount: 62000, categoryId: 'groceries', date: '2026-10-05' }),
    makeTransaction({ ...base, type: 'expense', amount: 30000, categoryId: 'groceries', date: '2026-09-28' }),
    makeTransaction({ ...base, type: 'expense', amount: 4000, currency: 'USD', rate: 15.42, categoryId: 'shopping', date: '2026-10-06' }),
  ];
  return s;
}

test('balance and monthSummary use converted MVR amounts', () => {
  const s = sampleState();
  assert.equal(balance(s), 100000 + 1000000 - 62000 - 30000 - 61680);
  const oct = monthSummary(s.transactions, '2026-10');
  assert.equal(oct.income, 1000000);
  assert.equal(oct.expense, 62000 + 61680);
  assert.deepEqual(oct.byCategory, { groceries: 62000, shopping: 61680 });
});

test('budgetProgress only counts the given month', () => {
  const s = sampleState();
  const [groceries] = budgetProgress([{ categoryId: 'groceries', limit: 100000 }], s.transactions, '2026-10');
  assert.equal(groceries.spent, 62000);
  assert.equal(groceries.remaining, 38000);
  assert.equal(groceries.ratio, 0.62);
});

test('bills: overdue, paid and sorting', () => {
  const bills = [
    { id: 'b', name: 'Fibre', categoryId: 'telecom', amount: 100, dueDay: 15 },
    { id: 'a', name: 'STELCO', categoryId: 'utilities', amount: 200, dueDay: 5 },
    { id: 'c', name: 'Rent', categoryId: 'rent', amount: 300, dueDay: 1, paidMonth: '2026-10' },
  ];
  assert.deepEqual(billStatus(bills[1], oct10), { dueDate: '2026-10-05', paid: false, daysUntil: -5, overdue: true });
  assert.equal(billStatus(bills[2], oct10).paid, true);
  assert.deepEqual(unpaidBills(bills, oct10).map((b) => b.id), ['a', 'b']);
});

test('safeToSpend reserves unpaid bills and spreads over remaining days', () => {
  const s = emptyState();
  s.settings.startingBalance = 220000;
  s.bills = [{ id: 'x', name: 'STELCO', categoryId: 'utilities', amount: 22000, dueDay: 20 }];
  const result = safeToSpend(s, oct10);
  assert.equal(result.daysLeft, 22); // Oct 10..31
  assert.equal(result.total, 198000);
  assert.equal(result.perDay, 9000);
});

test('safeToSpend never goes negative', () => {
  const s = emptyState();
  s.bills = [{ id: 'x', name: 'Loan', categoryId: 'loan', amount: 500000, dueDay: 25 }];
  assert.equal(safeToSpend(s, oct10).total, 0);
});

test('demoState is internally consistent for any day of the month', () => {
  for (const d of [new Date(2026, 9, 1), oct10, new Date(2026, 1, 28)]) {
    const s = demoState(d);
    for (const t of s.transactions) {
      assert.ok(isValidISODate(t.date));
      assert.ok(t.date <= `2026-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`);
    }
    assert.ok(balance(s) > 0);
  }
});

test('parseAmount rejects absurdly large numbers', () => {
  assert.equal(parseAmount('99999999999'), null);
  assert.equal(parseAmount('9999999999.99'), 999999999999);
});

test('parseSavedState drops malformed data instead of trusting it', () => {
  const good = demoState(oct10);
  assert.deepEqual(parseSavedState(JSON.stringify(good)), good);
  assert.deepEqual(parseSavedState('not json'), emptyState());
  assert.deepEqual(parseSavedState('null'), emptyState());
  const bad = parseSavedState(
    JSON.stringify({
      transactions: [{ id: 'x', type: 'hack', amount: '1' }, good.transactions[0]],
      budgets: 'nope',
      bills: [{ id: 'b', name: 'x'.repeat(5000), categoryId: 'rent', amount: 1, dueDay: 5 }],
      settings: { usdRate: -3, startingBalance: 1.5 },
    }),
  );
  assert.equal(bad.transactions.length, 1);
  assert.deepEqual(bad.budgets, []);
  assert.deepEqual(bad.bills, []);
  assert.deepEqual(bad.settings, emptyState().settings);
});
