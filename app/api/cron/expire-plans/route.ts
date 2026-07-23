import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export const runtime = "nodejs"

// Backup sync only — the real-time source of truth is getEffectivePlan()
// (lib/config/plans.ts), checked lazily on every gate/usage read. This cron
// just keeps the stored `plan` column from drifting for users who don't
// trigger a lazy check for a while.
export async function GET(request: Request): Promise<NextResponse> {
  const authHeader = request.headers.get("Authorization")
  const cronSecret = process.env.CRON_SECRET

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const result = await prisma.user.updateMany({
    where: {
      plan: { not: "FREE" },
      planExpiresAt: { lt: new Date() },
    },
    data: { plan: "FREE", planExpiresAt: null },
  })

  return NextResponse.json({ downgraded: result.count })
}
