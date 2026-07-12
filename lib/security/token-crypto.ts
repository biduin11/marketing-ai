import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "node:crypto"

const ALGORITHM = "aes-256-gcm"
const IV_LENGTH = 12

function getKey(): Buffer {
  const secret = process.env.ENCRYPTION_KEY
  if (!secret) throw new Error("ENCRYPTION_KEY не задан")
  return scryptSync(secret, "yandex-metrika-token", 32)
}

/** Encrypts a plaintext secret (e.g. OAuth token) for storage in the database. */
export function encryptToken(plain: string): string {
  const iv = randomBytes(IV_LENGTH)
  const cipher = createCipheriv(ALGORITHM, getKey(), iv)
  const encrypted = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()])
  const authTag = cipher.getAuthTag()
  return [iv, authTag, encrypted].map((b) => b.toString("hex")).join(":")
}

export function decryptToken(payload: string): string {
  const [ivHex, authTagHex, dataHex] = payload.split(":")
  if (!ivHex || !authTagHex || !dataHex) {
    throw new Error("Некорректный формат зашифрованного токена")
  }
  const decipher = createDecipheriv(ALGORITHM, getKey(), Buffer.from(ivHex, "hex"))
  decipher.setAuthTag(Buffer.from(authTagHex, "hex"))
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(dataHex, "hex")),
    decipher.final(),
  ])
  return decrypted.toString("utf8")
}
