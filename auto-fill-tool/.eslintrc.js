/**
 * ESLint Configuration - Optimized for Development Speed
 */
module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    project: './tsconfig.json',
  },
  plugins: ['@typescript-eslint'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
  ],
  rules: {
    // Critical errors only
    '@typescript-eslint/no-unused-vars': ['error', { 'argsIgnorePattern': '^_' }],
    '@typescript-eslint/no-explicit-any': 'warn',
    'no-console': 'off',
    'prefer-const': 'error',
    'no-var': 'error',
    'no-undef': 'off', // TypeScript handles this
  },
  ignorePatterns: [
    'node_modules/',
    'dist/',
    'coverage/',
    '**/*.test.ts',
    '**/*.test.ts.bak',
    '**/__tests__/**',
    'tests/',
    '*.config.js',
    '*.setup.js',
  ],
  env: {
    browser: true,
    node: true,
    es6: true,
  },
};
