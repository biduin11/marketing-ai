import { defineConfig } from "prisma/config"

// Database connection is configured via the PrismaClient adapter in lib/prisma.ts.
// This file only needed for schema resolution during `prisma generate`.
export default defineConfig({
  schema: "./prisma/schema.prisma",
})
