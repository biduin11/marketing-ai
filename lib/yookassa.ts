export function getAppUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.AUTH_URL ??
    "http://localhost:3000"
  )
}

export function getYookassaAuthHeader(): string {
  const shopId = process.env.YOOKASSA_SHOP_ID
  const secretKey = process.env.YOOKASSA_SECRET_KEY
  if (!shopId || !secretKey) {
    throw new Error("YOOKASSA_SHOP_ID / YOOKASSA_SECRET_KEY is not set")
  }
  return "Basic " + Buffer.from(`${shopId}:${secretKey}`).toString("base64")
}
