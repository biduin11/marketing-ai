import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
} from "node:crypto"

// AES-256-GCM reversible encryption for integration access tokens.
// We must be able to decrypt tokens to call external APIs, so a one-way
// hash (bcrypt) is not applicable here.
//
// Key: INTEGRATION_ENCRYPTION_KEY — 32 bytes as 64 hex chars.
// Generate with: openssl rand -hex 32

const ALGORITHM = "aes-256-gcm"
const IV_LENGTH = 12 // GCM standard nonce size
const AUTH_TAG_LENGTH = 16

function getKey(): Buffer {
  const raw = process.env.INTEGRATION_ENCRYPTION_KEY
  if (!raw) {
    throw new Error(
      "INTEGRATION_ENCRYPTION_KEY is not set (expected 64 hex chars)"
    )
  }
  const key = Buffer.from(raw, "hex")
  if (key.length !== 32) {
    throw new Error(
      "INTEGRATION_ENCRYPTION_KEY must be 32 bytes (64 hex chars)"
    )
  }
  return key
}

/**
 * Encrypts a plaintext string. Output format: iv:authTag:ciphertext (all hex).
 */
export function encrypt(plaintext: string): string {
  const iv = randomBytes(IV_LENGTH)
  const cipher = createCipheriv(ALGORITHM, getKey(), iv)
  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ])
  const authTag = cipher.getAuthTag()
  return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted.toString("hex")}`
}

/**
 * Decrypts a value produced by {@link encrypt}. Returns null on malformed
 * input or auth-tag mismatch (tampered / wrong key) instead of throwing,
 * so a single bad token cannot crash a sync run.
 */
export function decrypt(payload: string): string | null {
  try {
    const [ivHex, authTagHex, dataHex] = payload.split(":")
    if (!ivHex || !authTagHex || !dataHex) return null
    const iv = Buffer.from(ivHex, "hex")
    const authTag = Buffer.from(authTagHex, "hex")
    if (iv.length !== IV_LENGTH || authTag.length !== AUTH_TAG_LENGTH) {
      return null
    }
    const decipher = createDecipheriv(ALGORITHM, getKey(), iv)
    decipher.setAuthTag(authTag)
    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(dataHex, "hex")),
      decipher.final(),
    ])
    return decrypted.toString("utf8")
  } catch {
    return null
  }
}
