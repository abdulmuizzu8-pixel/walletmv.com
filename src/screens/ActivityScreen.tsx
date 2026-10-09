import { useMemo, useState } from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';

import { TransactionRow } from '../components/TransactionRow';
import { categoryById, formatMoney, monthKey, monthSummary, type Transaction } from '../lib/finance';
import { useStore } from '../store';
import { Card, Chip, ChipRow, Empty, confirm, styles } from '../ui';

export function ActivityScreen() {
  const { state, dispatch } = useStore();
  const months = useMemo(() => {
    const keys = new Set(state.transactions.map((t) => monthKey(t.date)));
    keys.add(monthKey(new Date()));
    return [...keys].sort().reverse();
  }, [state.transactions]);
  const [month, setMonth] = useState(months[0]);

  const list = state.transactions.filter((t) => monthKey(t.date) === month).sort((a, b) => b.date.localeCompare(a.date));
  const summary = monthSummary(state.transactions, month);
  const topCategories = Object.entries(summary.byCategory)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);

  function confirmDelete(tx: Transaction) {
    confirm('Delete transaction?', `${tx.note || categoryById(tx.categoryId).label} · ${formatMoney(tx.mvr)}`, 'Delete', () =>
      dispatch({ type: 'deleteTransaction', id: tx.id }),
    );
  }

  return (
    <FlatList
      data={list}
      keyExtractor={(t) => t.id}
      contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
      ListHeaderComponent={
        <View style={{ gap: 14, marginBottom: 14 }}>
          <ChipRow>
            {months.map((m) => (
              <Chip key={m} label={m} selected={m === month} onPress={() => setMonth(m)} />
            ))}
          </ChipRow>
          <Card>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <View>
                <Text style={styles.muted}>Income</Text>
                <Text style={[styles.amount, { color: '#059669' }]}>{formatMoney(summary.income)}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.muted}>Spent</Text>
                <Text style={styles.amount}>{formatMoney(summary.expense)}</Text>
              </View>
            </View>
            {topCategories.length ? (
              <View style={{ marginTop: 12, gap: 4 }}>
                {topCategories.map(([id, amount]) => (
                  <View key={id} style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={styles.muted}>
                      {categoryById(id).icon} {categoryById(id).label}
                    </Text>
                    <Text style={styles.muted}>{formatMoney(amount)}</Text>
                  </View>
                ))}
              </View>
            ) : null}
          </Card>
          <Text style={styles.muted}>Long-press a transaction to delete it.</Text>
        </View>
      }
      ListEmptyComponent={<Empty text="No transactions this month" />}
      renderItem={({ item, index }) => (
        <Pressable onLongPress={() => confirmDelete(item)} style={{ backgroundColor: '#fff', paddingHorizontal: 16 }}>
          <TransactionRow tx={item} first={index === 0} />
        </Pressable>
      )}
    />
  );
}
