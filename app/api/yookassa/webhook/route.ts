import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getYookassaPayment } from "@/lib/services/yookassa.service"
import type { Plan } from "@prisma/client"

export const runtime = "nodejs"

export async function POST(request: Request): Promise<NextResponse> {
  const body = await request.json()

  if (body.event !== "payment.succeeded") {
    return NextResponse.json({ ok: true })
  }

  const paymentId = body.object?.id
  if (!paymentId) {
    return NextResponse.json({ error: "Missing payment id" }, { status: 400 })
  }

  // Не доверяем телу запроса (ЮКасса не подписывает вебхуки) — перезапрашиваем
  // статус платежа напрямую у ЮКассы по id.
  const realPayment = await getYookassaPayment(paymentId)

  if (realPayment.status !== "succeeded") {
    return NextResponse.json({ ok: true })
  }

  const { userId, plan } = realPayment.metadata ?? {}
  if (!userId || !plan) {
    return NextResponse.json({ error: "Missing metadata" }, { status: 400 })
  }

  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 30)

  await prisma.$transaction([
    prisma.payment.updateMany({
      where: { yookassaId: paymentId },
      data: { status: "SUCCEEDED", paidAt: new Date(), expiresAt },
    }),
    prisma.user.update({
      where: { id: userId },
      data: { plan: plan as Plan, planExpiresAt: expiresAt },
    }),
  ])

  return NextResponse.json({ ok: true })
}
