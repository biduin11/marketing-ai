"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { getAppUrl } from "@/lib/yookassa"
import { createYookassaPayment, getYookassaPayment } from "@/lib/services/yookassa.service"
import { PLAN_LIMITS, type PlanName } from "@/lib/config/plans"

type CreatePaymentResult =
  | { success: true; confirmationUrl: string }
  | { success: false; error: string }

type CheckPaymentStatusResult =
  | { success: true; status: "succeeded"; plan: PlanName }
  | { success: false; status: string }

export async function createPayment(plan: "PRO" | "MAX"): Promise<CreatePaymentResult> {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, error: "Нет доступа" }
  }

  const amount = PLAN_LIMITS[plan].price

  try {
    const payment = await createYookassaPayment({
      userId: session.user.id,
      plan,
      amount,
      returnUrl: `${getAppUrl()}/settings?payment=success`,
    })

    if (!payment.confirmation?.confirmation_url) {
      return { success: false, error: "Не удалось получить ссылку на оплату" }
    }

    await prisma.payment.create({
      data: {
        userId: session.user.id,
        yookassaId: payment.id,
        plan,
        amount: Math.round(amount * 100),
        status: "PENDING",
      },
    })

    return { success: true, confirmationUrl: payment.confirmation.confirmation_url }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Не удалось создать платёж"
    return { success: false, error: message }
  }
}

// Вызывается со страницы /settings после возврата с ЮКассы (?payment=success).
// Не доверяет query-параметрам — сверяет реальный статус платежа через ЮКассу API.
// Вебхук (app/api/yookassa/webhook/route.ts) — тот же путь обновления, backup на случай,
// если пользователь закрыл вкладку до возврата.
export async function checkPaymentStatus(): Promise<CheckPaymentStatusResult> {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, status: "unauthorized" }
  }

  const payment = await prisma.payment.findFirst({
    where: { userId: session.user.id, status: "PENDING" },
    orderBy: { createdAt: "desc" },
  })

  if (!payment) return { success: false, status: "not_found" }

  const ykPayment = await getYookassaPayment(payment.yookassaId)

  if (ykPayment.status === "succeeded") {
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 30)

    await prisma.$transaction([
      prisma.payment.update({
        where: { id: payment.id },
        data: { status: "SUCCEEDED", paidAt: new Date(), expiresAt },
      }),
      prisma.user.update({
        where: { id: payment.userId },
        data: { plan: payment.plan, planExpiresAt: expiresAt },
      }),
    ])

    return { success: true, status: "succeeded", plan: payment.plan as PlanName }
  }

  return { success: false, status: ykPayment.status }
}
