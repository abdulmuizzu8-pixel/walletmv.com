// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*', '.expo/*'],
  },
  {
    // SettingsScreen syncs its form from the store inside an effect on purpose.
    files: ['src/screens/SettingsScreen.tsx'],
    rules: { 'react-hooks/set-state-in-effect': 'off' },
  },
]);
