import { createEnv } from "@t3-oss/env-nextjs"
import { z } from "zod"

export const env = createEnv({
  server: {
    DATABASE_URL: z.string().url(),
    AUTH_SECRET: z.string().min(32),
    AUTH_URL: z.string().url().optional(),
    ANTHROPIC_API_KEY: z.string().min(1),
    OPENAI_API_KEY: z.string().min(1).optional(),
    GEMINI_API_KEY: z.string().min(1).optional(),
    DEEPSEEK_API_KEY: z.string().min(1).optional(),
    AI_PROVIDER: z.enum(["anthropic", "gemini"]).optional(),
    CRON_SECRET: z.string().min(32).optional(),
    // scrypt derives the 32-byte AES key; keep existing non-empty secrets valid.
    ENCRYPTION_KEY: z.string().min(1).optional(),
    STRIPE_SECRET_KEY: z.string().min(1).optional(),
    STRIPE_WEBHOOK_SECRET: z.string().min(1).optional(),
    STRIPE_PRO_PRICE_ID: z.string().min(1).optional(),
  },
  client: {
    NEXT_PUBLIC_APP_URL: z.string().url().optional(),
  },
  experimental__runtimeEnv: {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  },
  // Explicit escape hatch for CI image builds that do not have runtime secrets.
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  emptyStringAsUndefined: true,
})
