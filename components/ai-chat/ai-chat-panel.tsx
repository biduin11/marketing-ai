"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { BotMessageSquare, X, Send, Loader2, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { useProjectStore } from "@/lib/store/project-store"
import { sendProjectChatMessage, type ChatMessage } from "@/lib/actions/chat"

const WELCOME = "Привет! Я знаю всё о вашем проекте: стратегию, аудиторию, конкурентов и метрики. Задайте любой вопрос."

export function AiChatPanel() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const activeProjectId = useProjectStore((s) => s.activeProjectId)

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [open])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const send = useCallback(async () => {
    const text = input.trim()
    if (!text || loading) return

    if (!activeProjectId) {
      setMessages((prev) => [
        ...prev,
        { role: "user", content: text },
        { role: "assistant", content: "Выберите активный проект, чтобы я мог отвечать на вопросы о нём." },
      ])
      setInput("")
      return
    }

    const userMsg: ChatMessage = { role: "user", content: text }
    setMessages((prev) => [...prev, userMsg])
    setInput("")
    setLoading(true)

    try {
      const result = await sendProjectChatMessage({
        projectId: activeProjectId,
        message: text,
        history: messages.slice(-10),
      })

      if (result.success) {
        setMessages((prev) => [...prev, { role: "assistant", content: result.reply }])
      } else {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: `Ошибка: ${result.error}` },
        ])
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Не удалось получить ответ. Попробуйте ещё раз." },
      ])
    } finally {
      setLoading(false)
    }
  }, [input, loading, activeProjectId, messages])

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      void send()
    }
  }

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "fixed bottom-6 right-6 z-50 flex size-12 items-center justify-center rounded-full bg-foreground text-background shadow-lg transition-transform hover:scale-105 active:scale-95",
          open && "rotate-0"
        )}
        aria-label="AI Ассистент"
      >
        {open ? <ChevronDown className="size-5" /> : <BotMessageSquare className="size-5" />}
      </button>

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-22 right-6 z-50 flex w-[360px] flex-col rounded-2xl border border-border bg-card shadow-xl"
          style={{ height: "480px" }}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <div className="flex items-center gap-2">
              <BotMessageSquare className="size-4 text-foreground" />
              <span className="text-sm font-semibold text-foreground">AI Ассистент</span>
            </div>
            <div className="flex items-center gap-2">
              {messages.length > 0 && (
                <button
                  onClick={() => setMessages([])}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  Очистить
                </button>
              )}
              <button onClick={() => setOpen(false)}>
                <X className="size-4 text-muted-foreground hover:text-foreground" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {/* Welcome */}
            <div className="flex gap-2">
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-foreground text-background">
                <BotMessageSquare className="size-3" />
              </span>
              <div className="rounded-2xl rounded-tl-sm bg-muted px-3 py-2 text-sm text-foreground max-w-[85%]">
                {WELCOME}
              </div>
            </div>

            {messages.map((m, i) => (
              <div
                key={i}
                className={cn(
                  "flex gap-2",
                  m.role === "user" ? "justify-end" : "justify-start"
                )}
              >
                {m.role === "assistant" && (
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-foreground text-background">
                    <BotMessageSquare className="size-3" />
                  </span>
                )}
                <div
                  className={cn(
                    "rounded-2xl px-3 py-2 text-sm max-w-[85%] whitespace-pre-wrap",
                    m.role === "user"
                      ? "bg-foreground text-background rounded-tr-sm"
                      : "bg-muted text-foreground rounded-tl-sm"
                  )}
                >
                  {m.content}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex gap-2">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-foreground text-background">
                  <BotMessageSquare className="size-3" />
                </span>
                <div className="flex items-center gap-1.5 rounded-2xl rounded-tl-sm bg-muted px-3 py-2">
                  <Loader2 className="size-3.5 animate-spin text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Думаю...</span>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="border-t border-border p-3">
            <div className="flex items-end gap-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Задайте вопрос о проекте..."
                rows={1}
                className="flex-1 resize-none rounded-xl border border-border bg-muted px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-[#111] max-h-24"
                style={{ minHeight: "38px" }}
                disabled={loading}
              />
              <button
                onClick={() => void send()}
                disabled={loading || !input.trim()}
                className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-foreground text-background disabled:opacity-40 hover:bg-foreground transition-colors"
              >
                <Send className="size-3.5" />
              </button>
            </div>
            <p className="mt-1.5 text-[10px] text-muted-foreground">Enter — отправить, Shift+Enter — новая строка</p>
          </div>
        </div>
      )}
    </>
  )
}
