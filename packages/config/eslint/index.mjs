import js from "@eslint/js";
import tseslint from "typescript-eslint";
import reactPlugin from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import jsxA11y from "eslint-plugin-jsx-a11y";
import eslintConfigPrettier from "eslint-config-prettier";

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    name: "babybook/base",
    languageOptions: {
      parserOptions: {
        // Mantemos o parser TS, mas sem regras type-aware por padrão.
        // Isso evita exigir tsconfig por pacote/app e reduz falsos positivos/ruído.
      },
    },
    plugins: {
      react: reactPlugin,
      "react-hooks": reactHooks,
      "jsx-a11y": jsxA11y,
    },
    rules: {
      ...reactPlugin.configs.recommended.rules,
      ...reactPlugin.configs["jsx-runtime"].rules,
      ...reactHooks.configs.recommended.rules,
      "react/jsx-props-no-spreading": "off",
      "react/react-in-jsx-scope": "off",
    },
    settings: {
      react: {
        // Evita warning quando pacotes sem `react` rodam lint (ex: packages/config).
        // Como usamos JSX runtime moderno, fixar a versão é suficiente aqui.
        version: "18.0",
      },
    },
  },
  eslintConfigPrettier,
);
