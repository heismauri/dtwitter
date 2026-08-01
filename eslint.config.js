// @ts-check
import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: ['deprecated/**', 'dist/**', 'public/**', 'go-fetch-script.js', 'worker-configuration.d.ts']
  },
  eslint.configs.recommended,
  tseslint.configs.recommended,
  {
    rules: {
      '@typescript-eslint/no-unused-vars': 'warn',
      '@typescript-eslint/no-non-null-assertion': 'off',
      'arrow-body-style': 'off',
      'comma-dangle': ['error', 'never'],
      'max-len': ['error', { code: 120, tabWidth: 2 }],
      'no-console': ['error', { allow: ['warn', 'error'] }],
      'no-param-reassign': 'off',
      'no-underscore-dangle': 'off',
      'no-unexpected-multiline': 'error',
      'quote-props': ['error', 'consistent'],
      'quotes': ['error', 'single', { avoidEscape: true }]
    }
  }
);
