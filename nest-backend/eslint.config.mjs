// @ts-check
import eslint from '@eslint/js';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: ['eslint.config.mjs'],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  eslintPluginPrettierRecommended,
  {
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
      },
      sourceType: 'commonjs',
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-floating-promises': 'warn',
      '@typescript-eslint/no-unsafe-argument': 'warn',
      "@typescript-eslint/no-deprecated": "error",
      "@typescript-eslint/no-unused-vars": "warn",
      "no-console": "warn",
      "@typescript-eslint/no-magic-numbers": ["warn", {
        ignoreEnums: true,
        ignoreReadonlyClassProperties: true,
      }],
      "@typescript-eslint/no-use-before-define": "error",
      "@typescript-eslint/no-empty-interface": "warn",
      "@typescript-eslint/no-unsafe-call": "off",
      "prefer-const": "warn",
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-empty-object-type": "off",
      "@typescript-eslint/no-unsafe-member-access": "off",
      "@typescript-eslint/no-unsafe-return": "off",
      "@typescript-eslint/no-redundant-type-constituents": "off",
    },
  },
);