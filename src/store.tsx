import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useReducer, useState, type ReactNode } from 'react';

import { demoState, emptyState, makeTransaction, monthKey, newId, type Bill, type Settings, type State, type Transaction } from './lib/finance';

const STORAGE_KEY = 'walletmv/state/v1';

export type Action =
  | { type: 'load'; state: State }
  | { type: 'addTransaction'; tx: Omit<Transaction, 'id' | 'mvr'> }
  | { type: 'deleteTransaction'; id: string }
  | { type: 'setBudget'; categoryId: string; limit: number }
  | { type: 'removeBudget'; categoryId: string }
  | { type: 'addBill'; bill: Omit<Bill, 'id'> }
  | { type: 'removeBill'; id: string }
  | { type: 'payBill'; id: string; method: string; date: string }
  | { type: 'updateSettings'; settings: Partial<Settings> }
  | { type: 'reset'; demo: boolean };

export function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'load':
      return action.state;
    case 'addTransaction':
      return { ...state, transactions: [makeTransaction(action.tx), ...state.transactions] };
    case 'deleteTransaction':
      return { ...state, transactions: state.transactions.filter((t) => t.id !== action.id) };
    case 'setBudget': {
      const others = state.budgets.filter((b) => b.categoryId !== action.categoryId);
      return { ...state, budgets: [...others, { categoryId: action.categoryId, limit: action.limit }] };
    }
    case 'removeBudget':
      return { ...state, budgets: state.budgets.filter((b) => b.categoryId !== action.categoryId) };
    case 'addBill':
      return { ...state, bills: [...state.bills, { ...action.bill, id: newId() }] };
    case 'removeBill':
      return { ...state, bills: state.bills.filter((b) => b.id !== action.id) };
    case 'payBill': {
      const bill = state.bills.find((b) => b.id === action.id);
      if (!bill) return state;
      const tx = makeTransaction({
        type: 'expense',
        amount: bill.amount,
        currency: 'MVR',
        rate: 1,
        categoryId: bill.categoryId,
        method: action.method,
        note: bill.name,
        date: action.date,
      });
      return {
        ...state,
        transactions: [tx, ...state.transactions],
        bills: state.bills.map((b) => (b.id === bill.id ? { ...b, paidMonth: monthKey(action.date) } : b)),
      };
    }
    case 'updateSettings':
      return { ...state, settings: { ...state.settings, ...action.settings } };
    case 'reset':
      return action.demo ? demoState(new Date()) : emptyState();
  }
}

type Store = { state: State; dispatch: (action: Action) => void; ready: boolean };

const StoreContext = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, () => demoState(new Date()));
  const [ready, setReady] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (raw) dispatch({ type: 'load', state: { ...emptyState(), ...JSON.parse(raw) } });
      })
      .catch(() => {
        // Corrupt or unreadable storage: keep the in-memory demo data.
      })
      .finally(() => setReady(true));
  }, []);

  useEffect(() => {
    // Don't overwrite saved data with the demo state before it has loaded.
    if (ready) AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state)).catch(() => {});
  }, [state, ready]);

  return <StoreContext.Provider value={{ state, dispatch, ready }}>{children}</StoreContext.Provider>;
}

export function useStore(): Store {
  const store = useContext(StoreContext);
  if (!store) throw new Error('useStore must be used inside StoreProvider');
  return store;
}
