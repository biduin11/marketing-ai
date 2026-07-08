import { GoogleGenerativeAI } from "@google/generative-ai"

/**
 * Model used for all Gemini-backed generations (temporary Anthropic fallback).
 * gemini-1.5-flash was retired by Google (404 on v1beta generateContent) —
 * using gemini-2.5-flash instead. If this also 404s, list currently
 * available models for your API key at https://ai.google.dev/gemini-api/docs/models
 * or call ModelService.ListModels, then update this constant.
 */
export const GEMINI_MODEL = "gemini-2.5-flash"

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
