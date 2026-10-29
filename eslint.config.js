import js from '@eslint/js';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';
import tseslint from 'typescript-eslint';

/**
 * Security rules for code that renders text from scanned repositories.
 * Exported so config/eslint.test.ts can prove they fire.
 */
export const securityRules = {
  // Never render repository-supplied text as HTML.
  'react/no-danger': 'error',
  'no-restricted-syntax': [
    'error',
    {
      selector: 'AssignmentExpression > MemberExpression[property.name=/^(innerHTML|outerHTML)$/]',
      message: 'Render text with React, never by assigning HTML.',
    },
    {
      selector: 'CallExpression[callee.property.name=/^(insertAdjacentHTML|createContextualFragment)$/]',
      message: 'Render text with React, never by parsing HTML.',
    },
    {
      selector: "CallExpression[callee.object.name='document'][callee.property.name=/^(write|writeln)$/]",
      message: 'document.write parses HTML.',
    },
  ],
  'no-eval': 'error',
  'no-implied-eval': 'error',
  'no-new-func': 'error',
  'no-script-url': 'error',
  'react/jsx-no-script-url': 'error',
  'react/jsx-no-target-blank': ['error', { allowReferrer: false }],
};

export default tseslint.config(
  { ignores: ['dist', 'coverage', 'playwright-report', 'test-results'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: { globals: { ...globals.browser } },
    plugins: { react, 'react-hooks': reactHooks },
    settings: { react: { version: 'detect' } },
    rules: {
      ...react.configs.recommended.rules,
      ...react.configs['jsx-runtime'].rules,
      ...reactHooks.configs.recommended.rules,
      ...securityRules,
      '@typescript-eslint/consistent-type-imports': 'error',
    },
  },
  {
    // Tests feed hostile strings such as javascript: URLs to the code under test.
    files: ['**/*.test.{ts,tsx}'],
    rules: { 'no-script-url': 'off' },
  },
  {
    files: ['vite.config.ts', 'playwright.config.ts', 'config/**', 'e2e/**', 'scripts/**', 'eslint.config.js'],
    languageOptions: { globals: { ...globals.node } },
  },
);
