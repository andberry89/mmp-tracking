import { defineConfig, globalIgnores } from "eslint/config";
import globals from "globals";
import js from "@eslint/js";
import tsParser from "@typescript-eslint/parser";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import pluginVue from "eslint-plugin-vue";

export default defineConfig([
  globalIgnores(["**/dist/**", "**/dist-ssr/**", "**/coverage/**"]),
  js.configs.recommended,
  ...pluginVue.configs["flat/recommended"],
  {
    name: "app/global-environment",
    files: ["**/*.{js,ts,jsx,tsx,vue}"],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
  },
  {
    name: "app/typescript",
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: "module",
        project: ["./tsconfig.json", "./tsconfig.node.json"],
      },
    },
    plugins: {
      "@typescript-eslint": tsPlugin,
    },
    rules: tsPlugin.configs.recommended.rules,
  },
  {
    name: "app/vue-typescript",
    files: ["**/*.vue"],
    languageOptions: {
      parserOptions: {
        parser: tsParser,
        ecmaVersion: 2020,
        sourceType: "module",
        project: ["./tsconfig.json", "./tsconfig.node.json"],
        extraFileExtensions: [".vue"],
      },
    },
    plugins: {
      "@typescript-eslint": tsPlugin,
    },
    rules: tsPlugin.configs.recommended.rules,
  },
]);
