import js from "@eslint/js";
import globals from "globals";
import pluginReact from "eslint-plugin-react";
import pluginTypeScript from "@typescript-eslint/eslint-plugin";
import parserTypeScript from "@typescript-eslint/parser";
import { defineConfig } from "eslint/config";


export default defineConfig([
  { files: ["**/*.{js,mjs,cjs,jsx,ts,tsx}"], plugins: { js, "@typescript-eslint": pluginTypeScript }, languageOptions: { parser: parserTypeScript }, extends: ["js/recommended", "@typescript-eslint/recommended"] },
  { files: ["**/*.{js,mjs,cjs,jsx}"], languageOptions: { globals: globals.browser } },
  { files: ["lib/services/machineLearning/**/*.ts"], languageOptions: { globals: globals.node } },
  pluginReact.configs.flat.recommended,
]);
