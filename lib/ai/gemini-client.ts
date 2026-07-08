import { GoogleGenerativeAI } from "@google/generative-ai"

/** Model used for all Gemini-backed generations (temporary Anthropic fallback). */
export const GEMINI_MODEL = "gemini-1.5-flash"

let client: GoogleGenerativeAI | null = null

/**
 * Lazily instantiated so importing this module doesn't throw when
 * GEMINI_API_KEY is unset and AI_PROVIDER isn't "gemini" (the common case).
 */
export function getGeminiClient(): GoogleGenerativeAI {
  if (!client) {
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not set")
    }
    client = new GoogleGenerativeAI(apiKey)
  }
  return client
}
