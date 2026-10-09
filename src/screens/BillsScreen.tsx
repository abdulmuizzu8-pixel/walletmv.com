import { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';

import { CATEGORIES, PAYMENT_METHODS, billStatus, formatMoney, parseAmount, toISODate, type Bill } from '../lib/finance';
import { useStore } from '../store';
import { Button, Card, Chip, ChipRow, Empty, Field, Label, SectionTitle, Sheet, colors, confirm, styles } from '../ui';

const BILL_PRESETS: { name: string; categoryId: string }[] = [
  { name: 'STELCO Electricity', categoryId: 'utilities' },
  { name: 'FENAKA Electricity', categoryId: 'utilities' },
  { name: 'MWSC Water', categoryId: 'utilities' },
  { name: 'Dhiraagu', categoryId: 'telecom' },
  { name: 'Ooredoo', categoryId: 'telecom' },
  { name: 'Rent', categoryId: 'rent' },
  { name: 'Loan EMI', categoryId: 'loan' },
  { name: 'School Fees', categoryId: 'education' },
];

export function BillsScreen() {
  const { state, dispatch } = useStore();
  const [adding, setAdding] = useState(false);
  const [paying, setPaying] = useState<Bill | null>(null);
  const today = new Date();
  const bills = state.bills.map((b) => ({ ...b, ...billStatus(b, today) })).sort((a, b) => Number(a.paid) - Number(b.paid) || a.dueDay - b.dueDay);
  const due = bills.filter((b) => !b.paid).reduce((s, b) => s + b.amount, 0);

  return (
    <ScrollView contentContainerStyle={styles.screen}>
      <Card style={{ backgroundColor: colors.warnSoft, borderColor: '#fde68a' }}>
        <Text style={[styles.muted, { color: colors.warn }]}>Still to pay this month</Text>
        <Text style={{ fontSize: 24, fontWeight: '900', color: colors.text, marginTop: 2 }}>{formatMoney(due)}</Text>
      </Card>

      <Card>
        <SectionTitle title="Monthly bills" subtitle="Mark a bill paid to log it as an expense" />
        {bills.length === 0 ? <Empty text="Add your STELCO, Dhiraagu, rent or loan payments" /> : null}
        {bills.map((b, i) => (
          <View key={b.id} style={[{ paddingVertical: 12 }, i > 0 && styles.divider]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowTitle}>{b.name}</Text>
                <Text style={[styles.muted, b.overdue && { color: colors.danger, fontWeight: '700' }, b.paid && { color: colors.income }]}>
                  {b.paid ? 'Paid this month' : b.overdue ? `Overdue · was due ${b.dueDate}` : `Due ${b.dueDate}`}
                </Text>
              </View>
              <Text style={styles.amount}>{formatMoney(b.amount)}</Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
              {!b.paid ? (
                <View style={{ flex: 1 }}>
                  <Button label="Mark paid" onPress={() => setPaying(b)} />
                </View>
              ) : null}
              <View style={{ flex: b.paid ? 1 : undefined, minWidth: 100 }}>
                <Button
                  label="Remove"
                  variant="secondary"
                  onPress={() => confirm('Remove bill?', b.name, 'Remove', () => dispatch({ type: 'removeBill', id: b.id }))}
                />
              </View>
            </View>
          </View>
        ))}
        <View style={{ marginTop: 8 }}>
          <Button label="+ Add bill" variant="secondary" onPress={() => setAdding(true)} />
        </View>
      </Card>

      {adding ? <AddBillSheet onClose={() => setAdding(false)} /> : null}
      {paying ? (
        <PayBillSheet
          bill={paying}
          onClose={() => setPaying(null)}
          onPay={(method) => {
            dispatch({ type: 'payBill', id: paying.id, method, date: toISODate(new Date()) });
            setPaying(null);
          }}
        />
      ) : null}
    </ScrollView>
  );
}

function AddBillSheet({ onClose }: { onClose: () => void }) {
  const { dispatch } = useStore();
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('utilities');
  const [amountText, setAmountText] = useState('');
  const [dueText, setDueText] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const amount = parseAmount(amountText);
  const dueDay = Number(dueText);
  const dueValid = Number.isInteger(dueDay) && dueDay >= 1 && dueDay <= 28;
  const nameValid = name.trim().length > 0;

  function save() {
    setSubmitted(true);
    if (!nameValid || amount === null || !dueValid) return;
    dispatch({ type: 'addBill', bill: { name: name.trim(), categoryId, amount, dueDay } });
    onClose();
  }

  return (
    <Sheet visible title="New bill" onClose={onClose}>
      <Label>Quick pick</Label>
      <ChipRow>
        {BILL_PRESETS.map((p) => (
          <Chip
            key={p.name}
            label={p.name}
            selected={name === p.name}
            onPress={() => {
              setName(p.name);
              setCategoryId(p.categoryId);
            }}
          />
        ))}
      </ChipRow>
      <Field label="Name" value={name} onChangeText={setName} placeholder="e.g. STELCO Electricity" error={submitted && !nameValid ? 'Enter a name' : null} />
      <Label>Category</Label>
      <ChipRow>
        {CATEGORIES.filter((c) => c.type === 'expense').map((c) => (
          <Chip key={c.id} label={`${c.icon} ${c.label}`} selected={categoryId === c.id} onPress={() => setCategoryId(c.id)} />
        ))}
      </ChipRow>
      <Field
        label="Usual amount (MVR)"
        value={amountText}
        onChangeText={setAmountText}
        keyboardType="decimal-pad"
        placeholder="e.g. 850"
        error={submitted && amount === null ? 'Enter an amount greater than 0' : null}
      />
      <Field
        label="Due day of the month (1-28)"
        value={dueText}
        onChangeText={setDueText}
        keyboardType="number-pad"
        placeholder="e.g. 12"
        error={submitted && !dueValid ? 'Pick a day from 1 to 28' : null}
      />
      <Button label="Save bill" onPress={save} />
    </Sheet>
  );
}

function PayBillSheet({ bill, onClose, onPay }: { bill: Bill; onClose: () => void; onPay: (method: string) => void }) {
  const [method, setMethod] = useState('BML Pay');
  return (
    <Sheet visible title={`Pay ${bill.name}`} onClose={onClose}>
      <Text style={{ fontSize: 28, fontWeight: '900', color: colors.text, marginBottom: 16 }}>{formatMoney(bill.amount)}</Text>
      <Label>Paid with</Label>
      <ChipRow>
        {PAYMENT_METHODS.map((m) => (
          <Chip key={m} label={m} selected={method === m} onPress={() => setMethod(m)} />
        ))}
      </ChipRow>
      <Button label="Mark as paid" onPress={() => onPay(method)} />
    </Sheet>
  );
}
