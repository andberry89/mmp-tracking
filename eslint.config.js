import { defineConfig, globalIgnores } from "eslint/config";
import globals from "globals";
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import pluginVue from "eslint-plugin-vue";

export default defineConfig([
  {
    name: "app/files-to-lint",
    files: ["**/*.{js,ts,jsx,tsx,vue}"], // ✅ add ts/tsx
  },

  globalIgnores(["**/dist/**", "**/dist-ssr/**", "**/coverage/**"]),

  {
    languageOptions: {
      parser: tseslint.parser, // ✅ TypeScript parser
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: "module",
        ecmaFeatures: { jsx: true },
        extraFileExtensions: [".vue"], // ✅ handle .vue files
        project: true, // enable if you use tsconfig.json
      },
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    plugins: {
      vue: pluginVue,
      "@typescript-eslint": tseslint.plugin,
    },
    rules: {
      // ✅ Recommended TS & Vue rules
      ...tseslint.configs.recommended.rules,
      ...pluginVue.configs["flat/recommended"].rules,
    },
  },

  js.configs.recommended,
]);
