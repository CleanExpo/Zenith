import js from "@eslint/js";
import globals from "globals";
import pluginReact from "eslint-plugin-react";
<<<<<<< HEAD
import pluginTypeScript from "@typescript-eslint/eslint-plugin";
import parserTypeScript from "@typescript-eslint/parser";
=======
>>>>>>> ef445f7eaef772d0e4a14069bfae6f16861de46d
import { defineConfig } from "eslint/config";


export default defineConfig([
<<<<<<< HEAD
  { files: ["**/*.{js,mjs,cjs,jsx,ts,tsx}"], plugins: { js, "@typescript-eslint": pluginTypeScript }, languageOptions: { parser: parserTypeScript }, extends: ["js/recommended", "@typescript-eslint/recommended"] },
  { files: ["**/*.{js,mjs,cjs,jsx}"], languageOptions: { globals: globals.browser } },
  { files: ["lib/services/machineLearning/**/*.ts"], languageOptions: { globals: globals.node } },
=======
  { files: ["**/*.{js,mjs,cjs,jsx}"], plugins: { js }, extends: ["js/recommended"] },
  { files: ["**/*.{js,mjs,cjs,jsx}"], languageOptions: { globals: globals.browser } },
>>>>>>> ef445f7eaef772d0e4a14069bfae6f16861de46d
  pluginReact.configs.flat.recommended,
]);
