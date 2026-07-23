import { getYookassaAuthHeader } from "@/lib/yookassa"

const YOOKASSA_API = "https://api.yookassa.ru/v3"

export interface YookassaPayment {
  id: string
  status: "pending" | "waiting_for_capture" | "succeeded" | "canceled"
  metadata?: { userId?: string; plan?: string }
  confirmation?: { confirmation_url?: string }
}

export async function createYookassaPayment({
  userId,
  plan,
  amount,
  returnUrl,
}: {
  userId: string
  plan: "PRO" | "MAX"
  amount: number // в рублях
  returnUrl: string
}): Promise<YookassaPayment> {
  const idempotenceKey = `${userId}-${plan}-${Date.now()}`

  const response = await fetch(`${YOOKASSA_API}/payments`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Idempotence-Key": idempotenceKey,
      Authorization: getYookassaAuthHeader(),
    },
    body: JSON.stringify({
      amount: {
        value: amount.toFixed(2),
        currency: "RUB",
      },
      confirmation: {
        type: "redirect",
        return_url: returnUrl,
      },
      capture: true,
      description: `AI Marketing OS — тариф ${plan} на 30 дней`,
      metadata: {
        userId,
        plan,
      },
    }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(`ЮКасса API error: ${JSON.stringify(error)}`)
  }

  return response.json() as Promise<YookassaPayment>
}

export async function getYookassaPayment(paymentId: string): Promise<YookassaPayment> {
  const response = await fetch(`${YOOKASSA_API}/payments/${paymentId}`, {
    headers: {
      Authorization: getYookassaAuthHeader(),
    },
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(`ЮКасса API error: ${JSON.stringify(error)}`)
  }

  return response.json() as Promise<YookassaPayment>
}
