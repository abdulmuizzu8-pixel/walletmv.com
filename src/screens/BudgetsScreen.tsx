import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { CATEGORIES, budgetProgress, categoryById, formatMoney, monthKey, parseAmount } from '../lib/finance';
import { useStore } from '../store';
import { Button, Card, Chip, ChipRow, Empty, Field, Label, ProgressBar, SectionTitle, Sheet, colors, styles } from '../ui';

export function BudgetsScreen() {
  const { state, dispatch } = useStore();
  const [editing, setEditing] = useState<string | null>(null);
  const month = monthKey(new Date());
  const progress = budgetProgress(state.budgets, state.transactions, month).sort((a, b) => b.ratio - a.ratio);
  const totalLimit = progress.reduce((s, b) => s + b.limit, 0);
  const totalSpent = progress.reduce((s, b) => s + b.spent, 0);

  return (
    <ScrollView contentContainerStyle={styles.screen}>
      <Card>
        <Text style={styles.muted}>Budgeted this month</Text>
        <Text style={{ fontSize: 24, fontWeight: '900', color: colors.text, marginVertical: 4 }}>
          {formatMoney(totalSpent)} <Text style={[styles.muted, { fontSize: 15 }]}>of {formatMoney(totalLimit)}</Text>
        </Text>
        <ProgressBar ratio={totalLimit ? totalSpent / totalLimit : 0} />
      </Card>

      <Card>
        <SectionTitle title="Category budgets" subtitle="Tap a budget to change it" />
        {progress.length === 0 ? <Empty text="Set a monthly limit for a category to track it here" /> : null}
        {progress.map((b) => {
          const c = categoryById(b.categoryId);
          return (
            <Pressable key={b.categoryId} onPress={() => setEditing(b.categoryId)} style={{ marginBottom: 16 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                <Text style={styles.rowTitle}>
                  {c.icon} {c.label}
                </Text>
                <Text style={[styles.muted, b.remaining < 0 && { color: colors.danger, fontWeight: '700' }]}>
                  {b.remaining < 0 ? `${formatMoney(-b.remaining)} over` : `${formatMoney(b.remaining)} left`}
                </Text>
              </View>
              <ProgressBar ratio={b.ratio} />
              <Text style={[styles.muted, { marginTop: 4 }]}>
                {formatMoney(b.spent)} of {formatMoney(b.limit)}
              </Text>
            </Pressable>
          );
        })}
        <Button label="+ Add budget" variant="secondary" onPress={() => setEditing('')} />
      </Card>

      {editing !== null ? (
        <BudgetSheet
          categoryId={editing}
          onClose={() => setEditing(null)}
          onSave={(categoryId, limit) => {
            dispatch({ type: 'setBudget', categoryId, limit });
            setEditing(null);
          }}
          onRemove={(categoryId) => {
            dispatch({ type: 'removeBudget', categoryId });
            setEditing(null);
          }}
        />
      ) : null}
    </ScrollView>
  );
}

function BudgetSheet({
  categoryId: initialCategory,
  onClose,
  onSave,
  onRemove,
}: {
  categoryId: string;
  onClose: () => void;
  onSave: (categoryId: string, limit: number) => void;
  onRemove: (categoryId: string) => void;
}) {
  const { state } = useStore();
  const existing = state.budgets.find((b) => b.categoryId === initialCategory);
  const [categoryId, setCategoryId] = useState(initialCategory || 'groceries');
  const [limitText, setLimitText] = useState(existing ? String(existing.limit / 100) : '');
  const [submitted, setSubmitted] = useState(false);
  const limit = parseAmount(limitText);

  return (
    <Sheet visible title={existing ? 'Edit budget' : 'New budget'} onClose={onClose}>
      {existing ? null : (
        <>
          <Label>Category</Label>
          <ChipRow>
            {CATEGORIES.filter((c) => c.type === 'expense').map((c) => (
              <Chip key={c.id} label={`${c.icon} ${c.label}`} selected={categoryId === c.id} onPress={() => setCategoryId(c.id)} />
            ))}
          </ChipRow>
        </>
      )}
      <Field
        label={`Monthly limit for ${categoryById(categoryId).label} (MVR)`}
        value={limitText}
        onChangeText={setLimitText}
        keyboardType="decimal-pad"
        placeholder="e.g. 3000"
        error={submitted && limit === null ? 'Enter an amount greater than 0' : null}
      />
      <View style={{ gap: 10 }}>
        <Button
          label="Save budget"
          onPress={() => {
            setSubmitted(true);
            if (limit !== null) onSave(categoryId, limit);
          }}
        />
        {existing ? <Button label="Remove budget" variant="danger" onPress={() => onRemove(categoryId)} /> : null}
      </View>
    </Sheet>
  );
}
