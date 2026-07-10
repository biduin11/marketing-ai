import { z } from "zod"
import { AI_TASKS, type AITask, type AIProvider } from "@/lib/ai/models"
import { generateStructuredWithAnthropic } from "@/lib/ai/generate-with-anthropic"
import { generateStructuredWithOpenAI } from "@/lib/ai/generate-with-openai"
import { generateStructuredWithGemini } from "@/lib/ai/generate-with-gemini"
import { classifyError } from "@/lib/ai/errors"

export type { AIProvider }

interface RouterRequest<T extends z.ZodType> {
  task: AITask
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
  console.log(parts.join(" | "))
}

async function callProvider<T extends z.ZodType>(
  provider: AIProvider,
  args: {
    model: string
    system: string
    prompt: string
    schema: T
    maxTokens?: number
    useWebSearch?: boolean
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
        useWebSearch: args.useWebSearch,
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
  }
}

/**
 * Single entry point for all structured AI generation in the app. Routes to
 * the provider assigned in AI_TASKS, and — for tasks that don't use
 * web_search — automatically retries once on Gemini if the primary call
 * fails with a transient error (rate limit, timeout, outage). Tasks with
 * useWebSearch (COMPETITORS/REPUTATION/MARKET) never fall back: Gemini has
 * no web_search equivalent, so a failure there surfaces as a clear error
 * instead of silently switching providers. Config/code errors (bad key,
 * bad schema, bad model name) never trigger a fallback either — see
 * lib/ai/errors.ts for the classification.
 */
export async function routeAI<T extends z.ZodType>(
  request: RouterRequest<T>
): Promise<RouterResult<z.infer<T>>> {
  const task = AI_TASKS[request.task]
  const start = Date.now()

  try {
    const result = await callProvider(task.provider, {
      model: task.model,
      system: request.system,
      prompt: request.prompt,
      schema: request.schema,
      maxTokens: request.maxTokens,
      useWebSearch: task.useWebSearch,
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

    if (task.useWebSearch) {
      logRouterEvent({
        task: request.task,
        provider: task.provider,
        model: task.model,
        status: "error",
        reason,
        executionTime,
      })
      throw new Error(
        `Модуль ${request.task} требует Anthropic (web_search) и временно недоступен: ${reason}`
      )
    }

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
      fallbackProvider: "gemini",
      executionTime,
    })

    // Max one retry, on Gemini, no loop.
    try {
      const fallback = await callProvider("gemini", {
        model: "gemini-2.5-flash",
        system: request.system,
        prompt: request.prompt,
        schema: request.schema,
        maxTokens: request.maxTokens,
      })
      const totalTime = Date.now() - start
      logRouterEvent({
        task: request.task,
        provider: "gemini",
        model: fallback.model,
        status: "success",
        fallbackProvider: "gemini",
        executionTime: totalTime,
      })
      return {
        data: fallback.data,
        provider: "gemini",
        model: fallback.model,
        usedFallback: true,
        executionTime: totalTime,
      }
    } catch {
      const totalTime = Date.now() - start
      logRouterEvent({
        task: request.task,
        provider: "gemini",
        model: "gemini-2.5-flash",
        status: "error",
        executionTime: totalTime,
      })
      throw new Error(
        `AI временно недоступен (${request.task}): основной и резервный провайдер не ответили`
      )
    }
  }
}
