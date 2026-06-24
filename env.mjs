import { createEnv } from "@t3-oss/env-nextjs"
import { z } from "zod"

export const env = createEnv({
  server: {
    DATABASE_URL: z.string().url(),
    AUTH_SECRET: z.string().min(1),
    AUTH_URL: z.string().url().optional(),
    ANTHROPIC_API_KEY: z.string().min(1),
  },
  // No client env vars yet.
  experimental__runtimeEnv: {},
  // Allow build without all vars set (validated at runtime on first use).
  skipValidation:
    !!process.env.SKIP_ENV_VALIDATION ||
    process.env.NODE_ENV === "production",
  emptyStringAsUndefined: true,
})
