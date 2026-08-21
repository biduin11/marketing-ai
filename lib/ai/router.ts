import { z } from "zod"
import { resolveTaskConfig, type AITask, type AIProvider, type PlanName } from "@/lib/ai/models"
import { generateStructuredWithAnthropic } from "@/lib/ai/generate-with-anthropic"
import { generateStructuredWithOpenAI } from "@/lib/ai/generate-with-openai"
import { generateStructuredWithGemini } from "@/lib/ai/generate-with-gemini"
import { generateStructuredWithClaudeHub } from "@/lib/ai/generate-with-claudehub"
import { classifyError } from "@/lib/ai/errors"

export type { AIProvider }

interface RouterRequest<T extends z.ZodType> {
  task: AITask
  plan: PlanName
  system: string
  prompt: string
  schema: T
  maxTokens?: number
}

interface RouterResult<T> {
  data: T
  provider: AIProvider
  model: string
  usedFallback: boolean
  executionTime: number
}

interface LogEvent {
  task: AITask
  provider: AIProvider
  model: string
  status: "success" | "fallback" | "error"
  reason?: string
  fallbackProvider?: AIProvider
  executionTime: number
}

function logRouterEvent(event: LogEvent): void {
  const parts = [
    `Provider: ${event.provider}`,
    `Model: ${event.model}`,
    `Status: ${event.status[0]!.toUpperCase()}${event.status.slice(1)}`,
  ]
  if (event.reason) parts.push(`Reason: ${event.reason}`)
  if (event.fallbackProvider) parts.push(`Fallback Provider: ${event.fallbackProvider}`)
  parts.push(`Execution Time: ${event.executionTime}ms`)
  console.info(parts.join(" | "))
}

async function callProvider<T extends z.ZodType>(
  provider: AIProvider,
  args: {
    model: string
    system: string
    prompt: string
    schema: T
    maxTokens?: number
  }
): Promise<{ data: z.infer<T>; model: string }> {
  switch (provider) {
    case "anthropic":
      return generateStructuredWithAnthropic({
        system: args.system,
        user: args.prompt,
        schema: args.schema,
        model: args.model,
        maxTokens: args.maxTokens,
      })
    case "openai":
      return generateStructuredWithOpenAI({
        system: args.system,
        user: args.prompt,
        schema: args.schema,
        model: args.model,
        maxTokens: args.maxTokens,
      })
    case "gemini":
      return generateStructuredWithGemini({
        system: args.system,
        user: args.prompt,
        schema: args.schema,
        maxTokens: args.maxTokens,
      })
    case "claudehub":
      // Never dispatched here — the fallback path in routeAI calls
      // generateStructuredWithClaudeHub directly (it needs originalProvider
      // + plan, not a bare model id). Kept for AIProvider exhaustiveness.
      throw new Error("callProvider does not support claudehub — use generateStructuredWithClaudeHub")
  }
}

/**
 * Single entry point for all structured AI generation in the app. Routes to
 * the provider/model resolved for (task, plan) via resolveTaskConfig, and
 * automatically retries once on ClaudeHub (api.claudehub.fun) if the primary
 * call fails with a transient error (rate limit, timeout, outage) —
 * including for COMPETITORS/REPUTATION/MARKET: their web search now runs
 * separately via Tavily (lib/services/tavily.service.ts) before routeAI is
 * ever called, so the prompt ClaudeHub receives already has the same search
 * results baked in as plain text. Schema/model/prompt bugs never trigger a
 * fallback — see lib/ai/errors.ts for the classification. A missing API key
 * IS fallback-eligible (absent config, not a code bug), but still logs a
 * console.warn below so it doesn't go unnoticed.
 *
 * Gemini (generate-with-gemini.ts) is no longer the automatic fallback here
 * — it's still used directly by lib/actions/chat.ts and
 * lib/actions/content-write.ts when AI_PROVIDER=gemini forces that path.
 */
export async function routeAI<T extends z.ZodType>(
  request: RouterRequest<T>
): Promise<RouterResult<z.infer<T>>> {
  const task = resolveTaskConfig(request.task, request.plan)
  const start = Date.now()

  try {
    const result = await callProvider(task.provider, {
      model: task.model,
      system: request.system,
      prompt: request.prompt,
      schema: request.schema,
      maxTokens: request.maxTokens,
    })
    const executionTime = Date.now() - start
    logRouterEvent({
      task: request.task,
      provider: task.provider,
      model: task.model,
      status: "success",
      executionTime,
    })
    return {
      data: result.data,
      provider: task.provider,
      model: result.model,
      usedFallback: false,
      executionTime,
    }
  } catch (error) {
    const { fallbackEligible, reason } = classifyError(error)
    const executionTime = Date.now() - start

    if (!fallbackEligible) {
      logRouterEvent({
        task: request.task,
        provider: task.provider,
        model: task.model,
        status: "error",
        reason,
        executionTime,
      })
      throw error
    }

    logRouterEvent({
      task: request.task,
      provider: task.provider,
      model: task.model,
      status: "fallback",
      reason,
      fallbackProvider: "claudehub",
      executionTime,
    })

    if (/missing (environment variable|api key)|is not set|is undefined/i.test(reason)) {
      console.warn(
        `[AI Router] ${task.provider} key missing for task ${request.task} — falling back to ClaudeHub. Reason: ${reason}`
      )
    }

    // Max one retry, on ClaudeHub, no loop.
    try {
      const fallback = await generateStructuredWithClaudeHub({
        originalProvider: task.provider,
        plan: request.plan,
        system: request.system,
        user: request.prompt,
        schema: request.schema,
        maxTokens: request.maxTokens,
      })
      const totalTime = Date.now() - start
      logRouterEvent({
        task: request.task,
        provider: "claudehub",
        model: fallback.model,
        status: "success",
        fallbackProvider: "claudehub",
        executionTime: totalTime,
      })
      return {
        data: fallback.data,
        provider: "claudehub",
        model: fallback.model,
        usedFallback: true,
        executionTime: totalTime,
      }
    } catch {
      const totalTime = Date.now() - start
      logRouterEvent({
        task: request.task,
        provider: "claudehub",
        model: "unknown",
        status: "error",
        executionTime: totalTime,
      })
      throw new Error(
        `AI временно недоступен (${request.task}): основной и резервный провайдер не ответили`
      )
    }
  }
}
