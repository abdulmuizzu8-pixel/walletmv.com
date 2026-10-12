import { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';

import { OFFICIAL_USD_RATE, formatMoney, parseAmount } from '../lib/finance';
import { useStore } from '../store';
import { Button, Card, Chip, ChipRow, Field, SectionTitle, confirm, styles } from '../ui';

export function SettingsScreen() {
  const { state, dispatch } = useStore();
  const [rateText, setRateText] = useState(String(state.settings.usdRate));
  const [startText, setStartText] = useState(String(state.settings.startingBalance / 100));
  const [saved, setSaved] = useState(false);
  const [syncedSettings, setSyncedSettings] = useState(state.settings);

  // Keep the form in sync when settings change elsewhere (e.g. data reset).
  // Adjusting state during render avoids an extra effect-driven render.
  if (syncedSettings !== state.settings) {
    setSyncedSettings(state.settings);
    setRateText(String(state.settings.usdRate));
    setStartText(String(state.settings.startingBalance / 100));
  }

  const rate = Number(rateText);
  const rateValid = Number.isFinite(rate) && rate > 0;
  const start = startText.trim() === '' || startText.trim() === '0' ? 0 : parseAmount(startText);

  function save() {
    if (!rateValid || start === null) return;
    dispatch({ type: 'updateSettings', settings: { usdRate: rate, startingBalance: start } });
    setSaved(true);
  }

  return (
    <ScrollView contentContainerStyle={styles.screen}>
      <Card>
        <SectionTitle title="Dollar rate" subtitle="Used as the default for new USD entries" />
        <Field
          label="MVR per 1 USD"
          value={rateText}
          onChangeText={(t) => {
            setRateText(t);
            setSaved(false);
          }}
          keyboardType="decimal-pad"
          error={!rateValid ? 'Enter a valid rate' : null}
        />
        <ChipRow>
          <Chip label={`Official (MMA) ${OFFICIAL_USD_RATE}`} selected={rate === OFFICIAL_USD_RATE} onPress={() => setRateText(String(OFFICIAL_USD_RATE))} />
        </ChipRow>
        <Text style={styles.muted}>
          Bought dollars above the bank rate? Enter what you actually paid so your MVR totals stay accurate.
        </Text>
      </Card>

      <Card>
        <SectionTitle title="Opening balance" subtitle="Cash and bank money before your first transaction" />
        <Field
          label="Opening balance (MVR)"
          value={startText}
          onChangeText={(t) => {
            setStartText(t);
            setSaved(false);
          }}
          keyboardType="decimal-pad"
          error={start === null ? 'Enter a valid amount' : null}
        />
        <Text style={styles.muted}>Current: {formatMoney(state.settings.startingBalance)}</Text>
      </Card>

      <Button label={saved ? 'Saved ✓' : 'Save settings'} onPress={save} disabled={!rateValid || start === null} />

      <Card>
        <SectionTitle title="Data" subtitle="Everything is stored only on this device" />
        <View style={{ gap: 10 }}>
          <Button
            label="Load sample data"
            variant="secondary"
            onPress={() => confirm('Load sample data?', 'This replaces everything you have entered.', 'Replace', () => dispatch({ type: 'reset', demo: true }))}
          />
          <Button
            label="Erase all data"
            variant="danger"
            onPress={() => confirm('Erase all data?', 'Transactions, budgets and bills will be deleted.', 'Erase', () => dispatch({ type: 'reset', demo: false }))}
          />
        </View>
      </Card>

      <Text style={[styles.muted, { textAlign: 'center' }]}>WalletMV · MVR-first personal finance · v1.0.0</Text>
    </ScrollView>
  );
}
