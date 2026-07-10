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
  // All AI provider calls must go through lib/ai/router.ts (routeAI()) —
  // no direct SDK usage in components, pages, API routes, or services.
  {
    files: ["**/*.ts", "**/*.tsx"],
    ignores: ["lib/ai/**"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "@anthropic-ai/sdk",
              message: "Используй routeAI() из lib/ai/router.ts вместо прямых вызовов Anthropic SDK.",
            },
            {
              name: "openai",
              message: "Используй routeAI() из lib/ai/router.ts вместо прямых вызовов OpenAI SDK.",
            },
            {
              name: "@google/generative-ai",
              message: "Используй routeAI() из lib/ai/router.ts вместо прямых вызовов Gemini SDK.",
            },
          ],
        },
      ],
    },
  },
]);

export default eslintConfig;
