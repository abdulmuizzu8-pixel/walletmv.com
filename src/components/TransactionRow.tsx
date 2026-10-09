import { Text, View } from 'react-native';

import { categoryById, formatMoney, type Transaction } from '../lib/finance';
import { colors, styles } from '../ui';

export function TransactionRow({ tx, first }: { tx: Transaction; first?: boolean }) {
  const category = categoryById(tx.categoryId);
  const income = tx.type === 'income';
  return (
    <View style={[styles.row, !first && styles.divider]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, gap: 12 }}>
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            backgroundColor: colors.brandSoft,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ fontSize: 18 }}>{category.icon}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.rowTitle} numberOfLines={1}>
            {tx.note || category.label}
          </Text>
          <Text style={styles.muted} numberOfLines={1}>
            {category.label} · {tx.method} · {tx.date}
          </Text>
        </View>
      </View>
      <View style={{ alignItems: 'flex-end', marginLeft: 8 }}>
        <Text style={[styles.amount, income && { color: colors.income }]}>
          {income ? '+ ' : '- '}
          {formatMoney(tx.mvr)}
        </Text>
        {tx.currency === 'USD' ? (
          <Text style={styles.muted}>
            {formatMoney(tx.amount, 'USD')} @ {tx.rate}
          </Text>
        ) : null}
      </View>
    </View>
  );
}
