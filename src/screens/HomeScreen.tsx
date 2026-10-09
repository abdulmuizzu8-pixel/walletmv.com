import { Pressable, ScrollView, Text, View } from 'react-native';

import { TransactionRow } from '../components/TransactionRow';
import { balance, budgetProgress, categoryById, formatMoney, monthKey, monthSummary, safeToSpend, unpaidBills } from '../lib/finance';
import { useStore } from '../store';
import { Card, Empty, ProgressBar, SectionTitle, colors, styles } from '../ui';

export type Tab = 'home' | 'activity' | 'budgets' | 'bills' | 'settings';

export function HomeScreen({ goTo }: { goTo: (tab: Tab) => void }) {
  const { state } = useStore();
  const today = new Date();
  const month = monthKey(today);
  const summary = monthSummary(state.transactions, month);
  const safe = safeToSpend(state, today);
  const bills = unpaidBills(state.bills, today).slice(0, 3);
  const budgets = budgetProgress(state.budgets, state.transactions, month)
    .sort((a, b) => b.ratio - a.ratio)
    .slice(0, 3);
  const recent = [...state.transactions].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);

  return (
    <ScrollView contentContainerStyle={styles.screen}>
      <View style={{ backgroundColor: colors.brandDark, borderRadius: 22, padding: 20 }}>
        <Text style={{ color: '#cffafe', fontWeight: '600' }}>Total balance</Text>
        <Text style={{ color: '#fff', fontSize: 34, fontWeight: '900', marginTop: 4 }}>{formatMoney(balance(state))}</Text>
        <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
          <Stat label="Income this month" value={formatMoney(summary.income)} />
          <Stat label="Spent this month" value={formatMoney(summary.expense)} />
        </View>
      </View>

      <Card>
        <Text style={styles.muted}>Safe to spend</Text>
        <Text style={{ fontSize: 26, fontWeight: '900', color: colors.text, marginTop: 2 }}>{formatMoney(safe.perDay)} / day</Text>
        <Text style={[styles.muted, { marginTop: 4 }]}>
          {formatMoney(safe.total)} for the next {safe.daysLeft} {safe.daysLeft === 1 ? 'day' : 'days'}, after unpaid bills
        </Text>
      </Card>

      <Card>
        <SectionTitle title="Upcoming bills" right={<Link label="All" onPress={() => goTo('bills')} />} />
        {bills.length === 0 ? <Empty text="All bills paid this month 🎉" /> : null}
        {bills.map((b, i) => (
          <View key={b.id} style={[styles.row, i > 0 && styles.divider]}>
            <View>
              <Text style={styles.rowTitle}>{b.name}</Text>
              <Text style={[styles.muted, b.overdue && { color: colors.danger, fontWeight: '700' }]}>
                {b.overdue ? `Overdue since ${b.dueDate}` : b.daysUntil === 0 ? 'Due today' : `Due in ${b.daysUntil} days`}
              </Text>
            </View>
            <Text style={styles.amount}>{formatMoney(b.amount)}</Text>
          </View>
        ))}
      </Card>

      <Card>
        <SectionTitle title="Budgets" subtitle="This month" right={<Link label="Manage" onPress={() => goTo('budgets')} />} />
        {budgets.length === 0 ? <Empty text="No budgets yet" /> : null}
        {budgets.map((b) => (
          <View key={b.categoryId} style={{ marginBottom: 12 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
              <Text style={styles.rowTitle}>{categoryById(b.categoryId).label}</Text>
              <Text style={styles.muted}>
                {formatMoney(b.spent)} / {formatMoney(b.limit)}
              </Text>
            </View>
            <ProgressBar ratio={b.ratio} />
          </View>
        ))}
      </Card>

      <Card>
        <SectionTitle title="Recent activity" right={<Link label="View all" onPress={() => goTo('activity')} />} />
        {recent.length === 0 ? <Empty text="Tap + to add your first transaction" /> : null}
        {recent.map((t, i) => (
          <TransactionRow key={t.id} tx={t} first={i === 0} />
        ))}
      </Card>
    </ScrollView>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 14, padding: 12 }}>
      <Text style={{ color: '#cffafe', fontSize: 12 }}>{label}</Text>
      <Text style={{ color: '#fff', fontSize: 16, fontWeight: '800', marginTop: 2 }}>{value}</Text>
    </View>
  );
}

function Link({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="link" hitSlop={8}>
      <Text style={{ color: colors.brandDark, fontWeight: '700' }}>{label}</Text>
    </Pressable>
  );
}
