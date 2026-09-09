import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

export default tseslint.config(
  // previewAuthStorage.ts is auto-generated and must not be edited.
  { ignores: ["dist", "src/integrations/supabase/previewAuthStorage.ts"] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      // React Compiler diagnostics added in eslint-plugin-react-hooks v6/v7.
      // Kept as warnings: they flag patterns that need component-level
      // refactors rather than build-blocking mistakes.
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/purity": "warn",
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
      "@typescript-eslint/no-unused-vars": "off",
    },
  },
  {
    // Edge functions initialise locals defensively before try/catch blocks
    // so error handlers always have a defined value to log.
    files: ["supabase/functions/**/*.{ts,tsx}"],
    rules: {
      "no-useless-assignment": "off",
    },
  },
);
