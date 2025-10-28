module.exports = {
  parser: '@typescript-eslint/parser',
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:prettier/recommended',
  ],
  plugins: ['@typescript-eslint'],
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
  },
  env: {
    browser: true,
    node: true,
    es6: true,
    webextensions: true,
  },
  rules: {
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    // Naming convention: disallow interface names prefixed with "I"
    '@typescript-eslint/naming-convention': [
      'error',
      {
        selector: 'interface',
        format: ['PascalCase'],
        custom: {
          regex: '^I[A-Z]',
          match: false,
        },
      },
    ],
    // Code complexity rules
    complexity: ['warn', 10], // Cyclomatic complexity
    'max-depth': ['warn', 4], // Maximum nesting depth
    'max-lines-per-function': ['warn', { max: 50, skipBlankLines: true, skipComments: true }],
    'max-lines': ['warn', { max: 300, skipBlankLines: true, skipComments: true }],
    'max-params': ['warn', 4], // Maximum number of parameters
  },
  overrides: [
    {
      // Test files: disable warning-level rules (only errors are checked)
      files: ['*.test.ts', '**/__tests__/**/*.ts'],
      rules: {
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/no-unused-vars': 'off',
        complexity: 'off',
        'max-depth': 'off',
        'max-lines-per-function': 'off',
        'max-lines': 'off',
        'max-params': 'off',
      },
    },
  ],
};
