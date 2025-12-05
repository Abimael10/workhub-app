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
    files: ["**/*.{ts,tsx}"],
    rules: {
      "@next/next/no-async-client-component": "error",
      "@next/next/no-document-import-in-page": "error",
      "@next/next/no-head-element": "error",
      "react-hooks/exhaustive-deps": [
        "error",
        {
          additionalHooks: "(use(Stable|Server|Effect)Callback|useTrackDependencies)",
        },
      ],
    },
  },
]);

export default eslintConfig;
