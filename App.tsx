import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

import { AddTransaction } from './src/components/AddTransaction';
import { ActivityScreen } from './src/screens/ActivityScreen';
import { BillsScreen } from './src/screens/BillsScreen';
import { BudgetsScreen } from './src/screens/BudgetsScreen';
import { HomeScreen, type Tab } from './src/screens/HomeScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { StoreProvider, useStore } from './src/store';
import { colors } from './src/ui';

const TABS: { id: Tab; label: string; icon: string; title: string }[] = [
  { id: 'home', label: 'Home', icon: '🏝️', title: 'WalletMV' },
  { id: 'activity', label: 'Activity', icon: '📋', title: 'Activity' },
  { id: 'budgets', label: 'Budgets', icon: '🎯', title: 'Budgets' },
  { id: 'bills', label: 'Bills', icon: '🧾', title: 'Bills' },
  { id: 'settings', label: 'Settings', icon: '⚙️', title: 'Settings' },
];

export default function App() {
  return (
    <SafeAreaProvider>
      <StoreProvider>
        <Shell />
      </StoreProvider>
    </SafeAreaProvider>
  );
}

function Shell() {
  const { ready } = useStore();
  const [tab, setTab] = useState<Tab>('home');
  const [adding, setAdding] = useState(false);
  const current = TABS.find((t) => t.id === tab)!;

  return (
    <SafeAreaView style={s.root} edges={['top', 'bottom']}>
      <StatusBar style="dark" />
      <View style={s.header}>
        <View>
          <Text style={s.title}>{current.title}</Text>
          {tab === 'home' ? <Text style={s.tagline}>Track. Plan. Prosper.</Text> : null}
        </View>
        <Pressable onPress={() => setAdding(true)} style={s.addButton} accessibilityRole="button" accessibilityLabel="Add transaction">
          <Text style={s.addText}>+ Add</Text>
        </Pressable>
      </View>

      <View style={{ flex: 1 }}>
        {!ready ? (
          <ActivityIndicator style={{ marginTop: 40 }} color={colors.brand} />
        ) : tab === 'home' ? (
          <HomeScreen goTo={setTab} />
        ) : tab === 'activity' ? (
          <ActivityScreen />
        ) : tab === 'budgets' ? (
          <BudgetsScreen />
        ) : tab === 'bills' ? (
          <BillsScreen />
        ) : (
          <SettingsScreen />
        )}
      </View>

      <View style={s.tabBar} accessibilityRole="tablist">
        {TABS.map((t) => (
          <Pressable
            key={t.id}
            onPress={() => setTab(t.id)}
            style={s.tab}
            accessibilityRole="tab"
            accessibilityState={{ selected: tab === t.id }}
          >
            <Text style={{ fontSize: 20, opacity: tab === t.id ? 1 : 0.5 }}>{t.icon}</Text>
            <Text style={[s.tabLabel, tab === t.id && { color: colors.brandDark }]}>{t.label}</Text>
          </Pressable>
        ))}
      </View>

      {adding ? <AddTransaction visible onClose={() => setAdding(false)} /> : null}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: { fontSize: 24, fontWeight: '900', color: colors.brandDark },
  tagline: { fontSize: 12, color: colors.muted, fontWeight: '600' },
  addButton: { backgroundColor: colors.brand, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12 },
  addText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 6,
    paddingBottom: 4,
  },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 4 },
  tabLabel: { fontSize: 11, fontWeight: '700', color: colors.muted, marginTop: 2 },
});
