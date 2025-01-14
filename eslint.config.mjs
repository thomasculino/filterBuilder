import globals from "globals";
import pluginReact from "eslint-plugin-react";
import pluginReactHooks from "eslint-plugin-react-hooks";
import pluginJsxA11y from "eslint-plugin-jsx-a11y";

/** @type {import('eslint').Linter.Config[]} */
export default [
  {
    files: ["**/*.{js,mjs,cjs,jsx}"],
    languageOptions: {
      globals: {
        "AudioWorkletGlobalScope": "readonly"
      }
    },
    settings: {
      react: {
        version: "detect" // Automatically detect the React version
      }
    },
  },
  pluginReact.configs.flat.recommended,
  {
    plugins: {
      "react-hooks": pluginReactHooks,
      "jsx-a11y": pluginJsxA11y,
    },
    rules: {
      "react-hooks/rules-of-hooks": "error", // Checks rules of Hooks
      "react-hooks/exhaustive-deps": "warn", // Checks effect dependencies
      "jsx-a11y/anchor-is-valid": "warn", // Warns if anchor tags are not valid
      "jsx-a11y/alt-text": "warn", // Warns if alt text is missing on images
    },
  },
];