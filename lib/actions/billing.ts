"use server"

import { auth } from "@/auth"
import { stripe, getAppUrl } from "@/lib/stripe"
import { prisma } from "@/lib/prisma"

type BillingResult =
  | { success: true; url: string }
  | { success: false; error: string }

export async function createCheckoutSession(): Promise<BillingResult> {
  const session = await auth()
  if (!session?.user?.id || !session.user.email) {
    return { success: false, error: "Нет доступа" }
  }

  const priceId = process.env.STRIPE_PRO_PRICE_ID
  if (!priceId) {
    return { success: false, error: "Биллинг не настроен" }
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { stripeCustomerId: true },
  })

  const appUrl = getAppUrl()

  const checkoutSession = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: user?.stripeCustomerId ?? undefined,
    customer_email: user?.stripeCustomerId ? undefined : session.user.email,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${appUrl}/settings?upgraded=1`,
    cancel_url: `${appUrl}/settings`,
    metadata: { userId: session.user.id },
    allow_promotion_codes: true,
  })

  if (!checkoutSession.url) {
    return { success: false, error: "Не удалось создать сессию оплаты" }
  }

  return { success: true, url: checkoutSession.url }
}

export async function createBillingPortalSession(): Promise<BillingResult> {
  const session = await auth()
  if (!session?.user?.id) {
    return { success: false, error: "Нет доступа" }
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { stripeCustomerId: true },
  })

  if (!user?.stripeCustomerId) {
    return { success: false, error: "Нет активной подписки" }
  }

  const appUrl = getAppUrl()

  const portalSession = await stripe.billingPortal.sessions.create({
    customer: user.stripeCustomerId,
    return_url: `${appUrl}/settings`,
  })

  return { success: true, url: portalSession.url }
}
