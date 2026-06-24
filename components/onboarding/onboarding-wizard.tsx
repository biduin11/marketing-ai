"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Loader2, ChevronRight, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { createProject } from "@/lib/actions/projects"
import { setActiveProject } from "@/lib/actions/active-project"

const STEPS = ["Компания", "Цели", "Детали"] as const

interface FormData {
  name: string
  niche: string
  budget: string
  goals: string
  website: string
  competitors: string
}

export function OnboardingWizard() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState<FormData>({
    name: "",
    niche: "",
    budget: "",
    goals: "",
    website: "",
    competitors: "",
  })

  function set(key: keyof FormData, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function next() {
    if (step === 0 && !form.name.trim()) {
      toast.error("Введите название компании")
      return
    }
    setStep((s) => s + 1)
  }

  async function submit() {
    setLoading(true)
    try {
      const result = await createProject({
        name: form.name,
        niche: form.niche || undefined,
        website: form.website || undefined,
        goals: form.goals || undefined,
        budget: form.budget ? parseInt(form.budget) : undefined,
        competitors: form.competitors
          ? form.competitors.split(",").map((c) => c.trim()).filter(Boolean)
          : undefined,
      })

      if (!result.success) {
        toast.error(result.error)
        return
      }

      await setActiveProject(result.data.id)
      toast.success("Проект создан! Начинаем работу.")
      router.push("/company")
      router.refresh()
    } catch {
      toast.error("Не удалось создать проект")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto w-full max-w-md">
      {/* Header */}
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-2xl bg-neutral-900">
          <Sparkles className="size-5 text-white" />
        </div>
        <h1 className="text-xl font-semibold text-foreground">Добро пожаловать в AI Marketing OS</h1>
        <p className="mt-1 text-sm text-muted-foreground">Создайте первый проект за 3 шага</p>
      </div>

      {/* Step indicator */}
      <div className="mb-8 flex items-center justify-center gap-2">
        {STEPS.map((label, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="flex flex-col items-center gap-1">
              <div
                className={`flex size-7 items-center justify-center rounded-full text-xs font-semibold transition-colors ${
                  i < step
                    ? "bg-neutral-900 text-white"
                    : i === step
                    ? "bg-neutral-900 text-white"
                    : "bg-neutral-100 text-muted-foreground"
                }`}
              >
                {i < step ? "✓" : i + 1}
              </div>
              <span className="text-[10px] text-muted-foreground">{label}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`mb-4 h-px w-8 ${i < step ? "bg-neutral-900" : "bg-neutral-200"}`} />
            )}
          </div>
        ))}
      </div>

      {/* Card */}
      <div className="rounded-2xl border border-[#eaeaea] bg-white p-6 shadow-sm">
        {step === 0 && (
          <div className="space-y-4">
            <div>
              <Label htmlFor="name" className="mb-1.5 block text-sm">
                Название компании <span className="text-[#dc2626]">*</span>
              </Label>
              <Input
                id="name"
                placeholder="Например: «Альфа Маркетинг»"
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                autoFocus
              />
            </div>
            <div>
              <Label htmlFor="niche" className="mb-1.5 block text-sm">
                Ниша / отрасль
              </Label>
              <Input
                id="niche"
                placeholder="Например: «EdTech, B2B SaaS, e-commerce»"
                value={form.niche}
                onChange={(e) => set("niche", e.target.value)}
              />
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <div>
              <Label htmlFor="goals" className="mb-1.5 block text-sm">
                Маркетинговые цели
              </Label>
              <Textarea
                id="goals"
                placeholder="Например: «Увеличить MRR на 30% за квартал, снизить CAC до 1500₽»"
                value={form.goals}
                onChange={(e) => set("goals", e.target.value)}
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="budget" className="mb-1.5 block text-sm">
                Ежемесячный маркетинговый бюджет (₽)
              </Label>
              <Input
                id="budget"
                type="number"
                min="0"
                placeholder="100000"
                value={form.budget}
                onChange={(e) => set("budget", e.target.value)}
              />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div>
              <Label htmlFor="website" className="mb-1.5 block text-sm">
                Сайт
              </Label>
              <Input
                id="website"
                placeholder="https://example.com"
                value={form.website}
                onChange={(e) => set("website", e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="competitors" className="mb-1.5 block text-sm">
                Конкуренты (через запятую)
              </Label>
              <Input
                id="competitors"
                placeholder="Компания А, Компания Б, Компания В"
                value={form.competitors}
                onChange={(e) => set("competitors", e.target.value)}
              />
            </div>
          </div>
        )}

        <div className="mt-6 flex justify-between gap-3">
          {step > 0 ? (
            <Button variant="outline" size="sm" onClick={() => setStep((s) => s - 1)}>
              Назад
            </Button>
          ) : (
            <div />
          )}
          {step < 2 ? (
            <Button size="sm" onClick={next}>
              Далее <ChevronRight className="size-3.5" />
            </Button>
          ) : (
            <Button size="sm" onClick={submit} disabled={loading}>
              {loading ? <Loader2 className="size-3.5 animate-spin" /> : <Sparkles className="size-3.5" />}
              Создать проект
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
