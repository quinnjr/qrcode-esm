import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import unicorn from 'eslint-plugin-unicorn';

export default tseslint.config(
  {
    ignores: ['dist/**', 'node_modules/**', 'examples/**', 'coverage/**', 'build.mjs', 'eslint.config.js', 'vitest.config.ts', 'test/**'],
  },
  js.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  unicorn.configs.recommended,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      'unicorn/prevent-abbreviations': 'off',
      'unicorn/filename-case': ['error', { cases: { kebabCase: true } }],
      'unicorn/no-null': 'off',
      'unicorn/prefer-code-point': 'off',
      '@typescript-eslint/explicit-member-accessibility': ['error', { accessibility: 'explicit' }],
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    },
  },
);
