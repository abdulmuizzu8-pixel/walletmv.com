// Core WalletMV money logic. Pure functions only, so it can be unit-tested
// without React Native. All amounts are integers in laari (1 MVR = 100 laari)
// to avoid floating-point drift.

export type Currency = 'MVR' | 'USD';
export type TxType = 'expense' | 'income';

export type Category = { id: string; label: string; icon: string; type: TxType };

export type Transaction = {
  id: string;
  type: TxType;
  /** Amount in the original currency's minor units (laari or cents). */
  amount: number;
  currency: Currency;
  /** MVR per 1 USD used for conversion; 1 for MVR transactions. */
  rate: number;
  /** Amount converted to laari; what every total is computed from. */
  mvr: number;
  categoryId: string;
  method: string;
  note: string;
  /** Local date, YYYY-MM-DD. */
  date: string;
};

export type Budget = { categoryId: string; limit: number };

export type Bill = {
  id: string;
  name: string;
  categoryId: string;
  amount: number;
  /** Day of month the bill is due, 1-28. */
  dueDay: number;
  /** YYYY-MM of the last month marked paid. */
  paidMonth?: string;
};

export type Settings = {
  /** MVR per 1 USD applied to new USD entries. */
  usdRate: number;
  startingBalance: number;
};

export type State = {
  transactions: Transaction[];
  budgets: Budget[];
  bills: Bill[];
  settings: Settings;
};

/** MMA official peg rate (MVR per USD). */
export const OFFICIAL_USD_RATE = 15.42;

export const CATEGORIES: Category[] = [
  { id: 'groceries', label: 'Groceries', icon: '🛒', type: 'expense' },
  { id: 'food', label: 'Food & Dining', icon: '🍛', type: 'expense' },
  { id: 'rent', label: 'Rent', icon: '🏠', type: 'expense' },
  { id: 'utilities', label: 'Electricity & Water', icon: '💡', type: 'expense' },
  { id: 'telecom', label: 'Mobile & Internet', icon: '📶', type: 'expense' },
  { id: 'transport', label: 'Transport & Ferry', icon: '⛴️', type: 'expense' },
  { id: 'loan', label: 'Loan / EMI', icon: '🏦', type: 'expense' },
  { id: 'family', label: 'Family Support', icon: '👪', type: 'expense' },
  { id: 'remittance', label: 'Remittance Abroad', icon: '🌏', type: 'expense' },
  { id: 'health', label: 'Health', icon: '🩺', type: 'expense' },
  { id: 'education', label: 'Education', icon: '📚', type: 'expense' },
  { id: 'shopping', label: 'Shopping', icon: '🛍️', type: 'expense' },
  { id: 'charity', label: 'Zakat & Sadaqah', icon: '🤲', type: 'expense' },
  { id: 'other', label: 'Other', icon: '•', type: 'expense' },
  { id: 'salary', label: 'Salary', icon: '💼', type: 'income' },
  { id: 'business', label: 'Business', icon: '🏪', type: 'income' },
  { id: 'tips', label: 'Service Charge & Tips', icon: '🌴', type: 'income' },
  { id: 'gift', label: 'Gift / Family', icon: '🎁', type: 'income' },
  { id: 'other-income', label: 'Other Income', icon: '•', type: 'income' },
];

export const PAYMENT_METHODS = [
  'Cash',
  'BML Card',
  'MIB Card',
  'Favara',
  'BML Pay',
  'DhiraaguPay',
  'm-Faisaa',
  'Bank Transfer',
];

export function categoryById(id: string): Category {
  return CATEGORIES.find((c) => c.id === id) ?? CATEGORIES.find((c) => c.id === 'other')!;
}

/** Parses user input like "1,250.5" into minor units; null if invalid or not positive. */
export function parseAmount(text: string): number | null {
  const cleaned = text.replace(/,/g, '').trim();
  // Max 10 whole digits (under 10 billion) so totals stay well inside safe integer range.
  if (!/^\d{1,10}(\.\d{1,2})?$/.test(cleaned)) return null;
  const value = Math.round(Number(cleaned) * 100);
  return value > 0 ? value : null;
}

export function toMVR(amount: number, currency: Currency, rate: number): number {
  return currency === 'MVR' ? amount : Math.round(amount * rate);
}

/** Formats minor units, e.g. 123450 -> "MVR 1,234.50", 120000 -> "MVR 1,200". */
export function formatMoney(minor: number, currency: Currency = 'MVR'): string {
  const sign = minor < 0 ? '-' : '';
  const abs = Math.abs(minor);
  const whole = Math.floor(abs / 100)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const cents = abs % 100;
  return `${sign}${currency} ${whole}${cents ? '.' + String(cents).padStart(2, '0') : ''}`;
}

export function pad(n: number): string {
  return String(n).padStart(2, '0');
}

export function toISODate(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function isValidISODate(s: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const [y, m, d] = s.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d;
}

export function monthKey(date: string | Date): string {
  return (typeof date === 'string' ? date : toISODate(date)).slice(0, 7);
}

export function daysInMonth(year: number, month1: number): number {
  return new Date(year, month1, 0).getDate();
}

export function balance(state: State): number {
  return state.transactions.reduce(
    (sum, t) => sum + (t.type === 'income' ? t.mvr : -t.mvr),
    state.settings.startingBalance,
  );
}

export type MonthSummary = { income: number; expense: number; byCategory: Record<string, number> };

export function monthSummary(transactions: Transaction[], month: string): MonthSummary {
  const summary: MonthSummary = { income: 0, expense: 0, byCategory: {} };
  for (const t of transactions) {
    if (monthKey(t.date) !== month) continue;
    if (t.type === 'income') {
      summary.income += t.mvr;
    } else {
      summary.expense += t.mvr;
      summary.byCategory[t.categoryId] = (summary.byCategory[t.categoryId] ?? 0) + t.mvr;
    }
  }
  return summary;
}

export type BudgetProgress = Budget & { spent: number; ratio: number; remaining: number };

export function budgetProgress(budgets: Budget[], transactions: Transaction[], month: string): BudgetProgress[] {
  const { byCategory } = monthSummary(transactions, month);
  return budgets.map((b) => {
    const spent = byCategory[b.categoryId] ?? 0;
    return { ...b, spent, ratio: b.limit > 0 ? spent / b.limit : 0, remaining: b.limit - spent };
  });
}

export type BillStatus = { dueDate: string; paid: boolean; daysUntil: number; overdue: boolean };

export function billStatus(bill: Bill, today: Date): BillStatus {
  const month = monthKey(today);
  const dueDate = `${month}-${pad(bill.dueDay)}`;
  const paid = bill.paidMonth === month;
  const daysUntil = bill.dueDay - today.getDate();
  return { dueDate, paid, daysUntil, overdue: !paid && daysUntil < 0 };
}

/** Bills not yet paid this month, soonest first. */
export function unpaidBills(bills: Bill[], today: Date): (Bill & BillStatus)[] {
  return bills
    .map((b) => ({ ...b, ...billStatus(b, today) }))
    .filter((b) => !b.paid)
    .sort((a, b) => a.dueDay - b.dueDay);
}

/**
 * What can be spent for the rest of the month after setting aside unpaid
 * bills: total and per remaining day (including today).
 */
export function safeToSpend(state: State, today: Date): { total: number; perDay: number; daysLeft: number } {
  const reserved = unpaidBills(state.bills, today).reduce((s, b) => s + b.amount, 0);
  const total = Math.max(0, balance(state) - reserved);
  const daysLeft = daysInMonth(today.getFullYear(), today.getMonth() + 1) - today.getDate() + 1;
  return { total, perDay: Math.floor(total / daysLeft), daysLeft };
}

export function newId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export function makeTransaction(input: Omit<Transaction, 'id' | 'mvr'>): Transaction {
  return { ...input, id: newId(), mvr: toMVR(input.amount, input.currency, input.rate) };
}

export function emptyState(): State {
  return {
    transactions: [],
    budgets: [],
    bills: [],
    settings: { usdRate: OFFICIAL_USD_RATE, startingBalance: 0 },
  };
}

/** Sample data for a Malé household, dated relative to `today`. */
export function demoState(today: Date): State {
  const day = (n: number) => {
    const d = new Date(today.getFullYear(), today.getMonth(), Math.max(1, Math.min(n, today.getDate())));
    return toISODate(d);
  };
  const tx = (
    type: TxType,
    mvr: number,
    categoryId: string,
    method: string,
    note: string,
    date: string,
  ): Transaction => makeTransaction({ type, amount: mvr * 100, currency: 'MVR', rate: 1, categoryId, method, note, date });

  return {
    settings: { usdRate: OFFICIAL_USD_RATE, startingBalance: 650000 },
    transactions: [
      tx('income', 14200, 'salary', 'Bank Transfer', 'Monthly salary', day(1)),
      tx('expense', 6500, 'rent', 'Favara', 'Hulhumalé flat', day(2)),
      tx('expense', 620, 'groceries', 'BML Card', 'STO', day(today.getDate())),
      tx('expense', 410, 'utilities', 'BML Pay', 'MWSC', day(today.getDate() - 1)),
      tx('expense', 165, 'food', 'Cash', 'Coffee with friends', day(4)),
      tx('expense', 1000, 'family', 'Favara', 'Sent to parents in atoll', day(3)),
      makeTransaction({
        type: 'expense',
        amount: 4000,
        currency: 'USD',
        rate: OFFICIAL_USD_RATE,
        categoryId: 'shopping',
        method: 'BML Card',
        note: 'Online order (USD card)',
        date: day(5),
      }),
    ],
    budgets: [
      { categoryId: 'groceries', limit: 300000 },
      { categoryId: 'food', limit: 150000 },
      { categoryId: 'transport', limit: 50000 },
      { categoryId: 'shopping', limit: 100000 },
    ],
    bills: [
      { id: newId(), name: 'STELCO Electricity', categoryId: 'utilities', amount: 85000, dueDay: 12 },
      { id: newId(), name: 'Ooredoo Postpaid', categoryId: 'telecom', amount: 35000, dueDay: 14 },
      { id: newId(), name: 'Dhiraagu Fibre', categoryId: 'telecom', amount: 116000, dueDay: 15 },
      { id: newId(), name: 'Bank Loan EMI', categoryId: 'loan', amount: 250000, dueDay: 25 },
    ],
  };
}

const isStr = (v: unknown, max = 500): v is string => typeof v === 'string' && v.length <= max;
const isInt = (v: unknown): v is number => typeof v === 'number' && Number.isSafeInteger(v);
const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);

function isTransaction(v: unknown): v is Transaction {
  const t = v as Transaction;
  return (
    typeof v === 'object' && v !== null &&
    isStr(t.id, 100) && (t.type === 'expense' || t.type === 'income') &&
    isInt(t.amount) && (t.currency === 'MVR' || t.currency === 'USD') &&
    isNum(t.rate) && isInt(t.mvr) && isStr(t.categoryId, 100) && isStr(t.method, 100) &&
    isStr(t.note) && isStr(t.date, 10) && isValidISODate(t.date)
  );
}

function isBudget(v: unknown): v is Budget {
  const b = v as Budget;
  return typeof v === 'object' && v !== null && isStr(b.categoryId, 100) && isInt(b.limit);
}

function isBill(v: unknown): v is Bill {
  const b = v as Bill;
  return (
    typeof v === 'object' && v !== null &&
    isStr(b.id, 100) && isStr(b.name, 200) && isStr(b.categoryId, 100) && isInt(b.amount) &&
    isInt(b.dueDay) && b.dueDay >= 1 && b.dueDay <= 31 &&
    (b.paidMonth === undefined || isStr(b.paidMonth, 7))
  );
}

/**
 * Turns saved JSON back into State, dropping anything malformed instead of
 * trusting it. Stored data can be corrupted or edited (e.g. in browser
 * devtools on the web build), so it is treated like any other untrusted input.
 */
export function parseSavedState(raw: string): State {
  const base = emptyState();
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return base;
  }
  if (typeof data !== 'object' || data === null) return base;
  const d = data as Partial<Record<keyof State, unknown>>;
  const s = (d.settings ?? {}) as Partial<Settings>;
  return {
    transactions: Array.isArray(d.transactions) ? d.transactions.filter(isTransaction) : [],
    budgets: Array.isArray(d.budgets) ? d.budgets.filter(isBudget) : [],
    bills: Array.isArray(d.bills) ? d.bills.filter(isBill) : [],
    settings: {
      usdRate: isNum(s.usdRate) && s.usdRate > 0 && s.usdRate < 1000 ? s.usdRate : base.settings.usdRate,
      startingBalance: isInt(s.startingBalance) ? s.startingBalance : base.settings.startingBalance,
    },
  };
}
