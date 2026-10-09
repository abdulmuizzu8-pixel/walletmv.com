import { useState } from 'react';
import { Text, View } from 'react-native';

import {
  CATEGORIES,
  OFFICIAL_USD_RATE,
  PAYMENT_METHODS,
  formatMoney,
  isValidISODate,
  parseAmount,
  toISODate,
  toMVR,
  type Currency,
  type TxType,
} from '../lib/finance';
import { useStore } from '../store';
import { Button, Chip, ChipRow, Field, Label, Sheet, colors } from '../ui';

/** Mount only while open so the form starts fresh with the current settings. */
export function AddTransaction({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { state, dispatch } = useStore();
  const [type, setType] = useState<TxType>('expense');
  const [amountText, setAmountText] = useState('');
  const [currency, setCurrency] = useState<Currency>('MVR');
  const [rateText, setRateText] = useState(String(state.settings.usdRate));
  const [categoryId, setCategoryId] = useState('groceries');
  const [method, setMethod] = useState('Cash');
  const [note, setNote] = useState('');
  const [date, setDate] = useState(toISODate(new Date()));
  const [submitted, setSubmitted] = useState(false);

  const amount = parseAmount(amountText);
  const rate = Number(rateText);
  const rateValid = currency === 'MVR' || (Number.isFinite(rate) && rate > 0);
  const dateValid = isValidISODate(date);
  const valid = amount !== null && rateValid && dateValid;

  function selectType(next: TxType) {
    setType(next);
    setCategoryId(next === 'income' ? 'salary' : 'groceries');
  }

  function save() {
    setSubmitted(true);
    if (!valid || amount === null) return;
    dispatch({
      type: 'addTransaction',
      tx: {
        type,
        amount,
        currency,
        rate: currency === 'USD' ? rate : 1,
        categoryId,
        method,
        note: note.trim(),
        date,
      },
    });
    onClose();
  }

  return (
    <Sheet visible={visible} title="Add transaction" onClose={onClose}>
      <ChipRow>
        <Chip label="Expense" selected={type === 'expense'} onPress={() => selectType('expense')} />
        <Chip label="Income" selected={type === 'income'} onPress={() => selectType('income')} />
      </ChipRow>

      <Label>Currency</Label>
      <ChipRow>
        <Chip label="MVR" selected={currency === 'MVR'} onPress={() => setCurrency('MVR')} />
        <Chip label="USD" selected={currency === 'USD'} onPress={() => setCurrency('USD')} />
      </ChipRow>

      <Field
        label={`Amount (${currency})`}
        value={amountText}
        onChangeText={setAmountText}
        keyboardType="decimal-pad"
        placeholder="0.00"
        error={submitted && amount === null ? 'Enter an amount greater than 0' : null}
      />

      {currency === 'USD' ? (
        <View style={{ marginBottom: 14 }}>
          <Field
            label="Rate (MVR per 1 USD)"
            value={rateText}
            onChangeText={setRateText}
            keyboardType="decimal-pad"
            error={submitted && !rateValid ? 'Enter a valid rate' : null}
          />
          <ChipRow>
            <Chip label={`Official ${OFFICIAL_USD_RATE}`} onPress={() => setRateText(String(OFFICIAL_USD_RATE))} />
            {state.settings.usdRate !== OFFICIAL_USD_RATE ? (
              <Chip label={`My rate ${state.settings.usdRate}`} onPress={() => setRateText(String(state.settings.usdRate))} />
            ) : null}
          </ChipRow>
          {amount !== null && rateValid ? (
            <Text style={{ color: colors.brandDark, fontWeight: '700' }}>
              = {formatMoney(toMVR(amount, 'USD', rate))}
            </Text>
          ) : null}
        </View>
      ) : null}

      <Label>Category</Label>
      <ChipRow>
        {CATEGORIES.filter((c) => c.type === type).map((c) => (
          <Chip key={c.id} label={`${c.icon} ${c.label}`} selected={categoryId === c.id} onPress={() => setCategoryId(c.id)} />
        ))}
      </ChipRow>

      <Label>Paid with</Label>
      <ChipRow>
        {PAYMENT_METHODS.map((m) => (
          <Chip key={m} label={m} selected={method === m} onPress={() => setMethod(m)} />
        ))}
      </ChipRow>

      <Field label="Note" value={note} onChangeText={setNote} placeholder="e.g. STO, ferry to Villimalé" />
      <Field
        label="Date (YYYY-MM-DD)"
        value={date}
        onChangeText={setDate}
        autoCapitalize="none"
        error={submitted && !dateValid ? 'Use a real date like 2026-10-09' : null}
      />

      <Button label="Save" onPress={save} />
    </Sheet>
  );
}
