import js from '@eslint/js';
import globals from 'globals';
import tsParser from '@typescript-eslint/parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import rn from 'eslint-plugin-react-native';

export default [
  js.configs.recommended,
  {
    files: [
      'eslint.config.js',
      'apps/mobile/babel.config.js',
      'apps/mobile/jest.config.js',
      'apps/mobile/jest.setup.js',
      'apps/mobile/**/.*.js',
    ],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'script',
      globals: {
        ...globals.node,
      },
    },
    rules: {
      'no-undef': 'off',
    },
  },

  {
    files: ['**/*.{ts,tsx,js,jsx}'],
    ignores: ['**/node_modules/**', '**/dist/**', '**/build/**', '.expo/**'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parser: tsParser,
      parserOptions: { ecmaFeatures: { jsx: true } },
      globals: { ...globals.browser, ...globals.es2021 },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
      react,
      'react-hooks': reactHooks,
      'react-native': rn,
    },
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      'react/react-in-jsx-scope': 'off',
      'react/jsx-uses-react': 'off',
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      'react-native/no-unused-styles': 'warn',
      'react-native/no-inline-styles': 'off',
    },
    settings: { react: { version: 'detect' } },
  },
];
