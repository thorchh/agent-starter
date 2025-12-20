import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    // AI Elements are generated source files (similar to a vendored component library).
    // We keep our own app code strict, but don't let lint rules block installs/updates.
    files: ["src/components/ai-elements/**/*.{ts,tsx}"],
    rules: {
      // AI Elements internal patterns occasionally violate these strict rules.
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/refs": "off",
      "react-hooks/static-components": "off",

      // AI Elements sometimes uses `any` internally for ergonomics.
      "@typescript-eslint/no-explicit-any": "off",

      // Reduce noise for generated UI primitives.
      "@typescript-eslint/no-unused-vars": "off",
      "@next/next/no-img-element": "off",
      "react-hooks/exhaustive-deps": "off",
    },
    linterOptions: {
      reportUnusedDisableDirectives: "off",
    },
  },
]);

export default eslintConfig;
