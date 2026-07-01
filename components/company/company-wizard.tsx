"use client"

import { Fragment, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Check, Loader2, Pencil, Plus, Trash2 } from "lucide-react"
import type { Project } from "@prisma/client"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { updateProject } from "@/lib/actions/projects"
import { cn } from "@/lib/utils"

// ─── Types ───────────────────────────────────────────────────────────────────

type Competitor = { name: string; site: string; description: string }

interface FormState {
  // Step 1
  name: string
  niche: string
  region: string
  products: string
  avgCheck: string
  dealCycle: string
  brandTone: string
  brandWords: string
  // Step 2
  clientType: string
  audienceSegments: string
  clientValues: string
  objections: string
  clientLanguage: string
  // Step 3
  currentChannels: string
  budget: string
  marketingGoal: string
  website: string
  instagram: string
  vk: string
  telegram: string
  youtube: string
  tiktok: string
  otherSocials: string
  yandexMaps: string
  twogis: string
  proofFacts: string
  // Step 4
  margin: string
  conversionRate: string
  currentCpl: string
  leadsPerMonth: string
  salesPerMonth: string
  // Step 5
  competitorsDetailed: Competitor[]
}

// ─── Options ─────────────────────────────────────────────────────────────────

const INDUSTRY_OPTIONS = [
  "Кровля / строительство",
  "Стоматология",
  "Производство",
  "Сельское хозяйство",
  "Розничная торговля",
  "Услуги для бизнеса",
  "IT / SaaS",
  "Ресторан / HoReCa",
  "Медицина",
  "Образование",
  "Другое",
]

const DEAL_CYCLE_OPTIONS = [
  "1 день",
  "1–7 дней",
  "1–4 недели",
  "1–3 месяца",
  "более 3 месяцев",
]

const BRAND_TONE_OPTIONS = [
  "Экспертный — авторитетно с деталями",
  "Дружелюбный — тепло и просто",
  "Премиальный — статусно и лаконично",
  "Энергичный — динамично и мотивирующе",
  "Нейтральный — информативно",
]

const CLIENT_TYPE_OPTIONS = ["Только B2C", "Только B2B", "И B2B и B2C"]

const MARKETING_GOAL_OPTIONS = [
  "Заявки / лиды",
  "Узнаваемость бренда",
  "Повторные продажи / LTV",
  "Выход на новый рынок",
  "Запуск нового продукта",
]

// ─── Helpers ─────────────────────────────────────────────────────────────────

type SocialLinksJson = {
  instagram?: string; vk?: string; telegram?: string
  youtube?: string; tiktok?: string; otherSocials?: string
  yandexMaps?: string; twogis?: string
}

function parseSocialLinks(raw: unknown): SocialLinksJson {
  if (!raw || typeof raw !== "string") return {}
  try {
    const parsed = JSON.parse(raw)
    if (parsed && typeof parsed === "object") return parsed as SocialLinksJson
  } catch {
    // legacy: comma-separated string → put in otherSocials
    return { otherSocials: raw }
  }
  return {}
}

function initForm(p: Project): FormState {
  const comps = (p.competitorsDetailed as Competitor[] | null) ?? []
  return {
    name: p.name,
    niche: p.niche ?? "",
    region: p.regions[0] ?? "",
    products: p.products.join(", "),
    avgCheck: (p as unknown as Record<string, unknown>).avgCheck?.toString() ?? "",
    dealCycle: ((p as unknown as Record<string, unknown>).dealCycle as string) ?? "",
    brandTone: ((p as unknown as Record<string, unknown>).brandTone as string) ?? "",
    brandWords: ((p as unknown as Record<string, unknown>).brandWords as string) ?? "",
    clientType: ((p as unknown as Record<string, unknown>).clientType as string) ?? "",
    audienceSegments: ((p as unknown as Record<string, unknown>).audienceSegments as string) ?? "",
    clientValues: ((p as unknown as Record<string, unknown>).clientValues as string) ?? "",
    objections: ((p as unknown as Record<string, unknown>).objections as string) ?? "",
    clientLanguage: ((p as unknown as Record<string, unknown>).clientLanguage as string) ?? "",
    currentChannels: ((p as unknown as Record<string, unknown>).currentChannels as string) ?? "",
    budget: p.budget?.toString() ?? "",
    marketingGoal: ((p as unknown as Record<string, unknown>).marketingGoal as string) ?? "",
    website: p.website ?? "",
    ...(() => {
      const s = parseSocialLinks((p as unknown as Record<string, unknown>).socialLinks)
      return {
        instagram: s.instagram ?? "",
        vk: s.vk ?? "",
        telegram: s.telegram ?? "",
        youtube: s.youtube ?? "",
        tiktok: s.tiktok ?? "",
        otherSocials: s.otherSocials ?? "",
        yandexMaps: s.yandexMaps ?? "",
        twogis: s.twogis ?? "",
      }
    })(),
    proofFacts: ((p as unknown as Record<string, unknown>).proofFacts as string) ?? "",
    margin: ((p as unknown as Record<string, unknown>).margin as number | undefined)?.toString() ?? "",
    conversionRate: ((p as unknown as Record<string, unknown>).conversionRate as number | undefined)?.toString() ?? "",
    currentCpl: ((p as unknown as Record<string, unknown>).currentCpl as number | undefined)?.toString() ?? "",
    leadsPerMonth: ((p as unknown as Record<string, unknown>).leadsPerMonth as number | undefined)?.toString() ?? "",
    salesPerMonth: ((p as unknown as Record<string, unknown>).salesPerMonth as number | undefined)?.toString() ?? "",
    competitorsDetailed: comps,
  }
}

function buildPayload(f: FormState) {
  return {
    name: f.name,
    niche: f.niche || undefined,
    regions: f.region ? [f.region] : [],
    products: f.products ? [f.products] : [],
    competitors: [] as string[],
    website: f.website || undefined,
    budget: f.budget ? Number(f.budget) : undefined,
    industry: f.niche || undefined,
    dealCycle: f.dealCycle || undefined,
    brandTone: f.brandTone || undefined,
    brandWords: f.brandWords || undefined,
    clientType: f.clientType || undefined,
    audienceSegments: f.audienceSegments || undefined,
    clientValues: f.clientValues || undefined,
    objections: f.objections || undefined,
    clientLanguage: f.clientLanguage || undefined,
    currentChannels: f.currentChannels || undefined,
    marketingGoal: f.marketingGoal || undefined,
    socialLinks: (() => {
      const obj: SocialLinksJson = {
        ...(f.instagram && { instagram: f.instagram }),
        ...(f.vk && { vk: f.vk }),
        ...(f.telegram && { telegram: f.telegram }),
        ...(f.youtube && { youtube: f.youtube }),
        ...(f.tiktok && { tiktok: f.tiktok }),
        ...(f.otherSocials && { otherSocials: f.otherSocials }),
        ...(f.yandexMaps && { yandexMaps: f.yandexMaps }),
        ...(f.twogis && { twogis: f.twogis }),
      }
      return Object.keys(obj).length > 0 ? JSON.stringify(obj) : undefined
    })(),
    proofFacts: f.proofFacts || undefined,
    margin: f.margin ? Number(f.margin) : undefined,
    conversionRate: f.conversionRate ? Number(f.conversionRate) : undefined,
    currentCpl: f.currentCpl ? Number(f.currentCpl) : undefined,
    leadsPerMonth: f.leadsPerMonth ? Number(f.leadsPerMonth) : undefined,
    salesPerMonth: f.salesPerMonth ? Number(f.salesPerMonth) : undefined,
    avgCheck: f.avgCheck ? Number(f.avgCheck) : undefined,
    competitorsDetailed: f.competitorsDetailed.length > 0 ? f.competitorsDetailed : undefined,
  }
}

// ─── UI primitives ────────────────────────────────────────────────────────────

const selectCls =
  "flex h-9 w-full rounded-lg border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none transition-[color,box-shadow] focus:border-ring focus:ring-3 focus:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"

function FieldSelect({
  id, label, value, onChange, options, hint, placeholder = "— выберите —",
}: {
  id: string; label: string; value: string
  onChange: (v: string) => void; options: string[]
  hint?: string; placeholder?: string
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <select id={id} value={value} onChange={(e) => onChange(e.target.value)} className={selectCls}>
        <option value="">{placeholder}</option>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  )
}

function FieldText({
  id, label, value, onChange, placeholder, hint, type = "text", required,
}: {
  id: string; label: string; value: string
  onChange: (v: string) => void; placeholder?: string
  hint?: string; type?: string; required?: boolean
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>
        {label}{required && <span className="ml-0.5 text-danger">*</span>}
      </Label>
      <Input id={id} type={type} value={value} onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder} />
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  )
}

function FieldTextarea({
  id, label, value, onChange, placeholder, hint, rows = 3,
}: {
  id: string; label: string; value: string
  onChange: (v: string) => void; placeholder?: string
  hint?: string; rows?: number
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Textarea id={id} rows={rows} value={value} onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder} />
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-5 mb-3 text-[11px] font-semibold uppercase tracking-widest text-[#6b7280]">
      {children}
    </p>
  )
}

function InfoBlock({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-5 rounded-lg border border-[#eaeaea] bg-neutral-50 px-4 py-3 text-xs text-[#6b7280] leading-relaxed">
      {children}
    </div>
  )
}

// ─── Progress ─────────────────────────────────────────────────────────────────

const STEP_LABELS = ["Бизнес", "Аудитория", "Маркетинг", "Экономика", "Конкуренты"]

function StepperProgress({ step }: { step: number }) {
  return (
    <div className="mt-4 space-y-2">
      <div className="flex items-center">
        {STEP_LABELS.map((label, i) => {
          const n = i + 1
          const done = n < step
          const active = n === step
          return (
            <Fragment key={n}>
              <div className="flex flex-col items-center gap-1">
                <div className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold transition-colors",
                  done   ? "bg-[#111] text-white" :
                  active ? "bg-[#111] text-white" :
                           "bg-neutral-100 text-[#6b7280]"
                )}>
                  {done ? <Check className="size-3.5" /> : n}
                </div>
                <span className={cn(
                  "text-[10px] whitespace-nowrap",
                  active ? "font-medium text-[#111]" : "text-[#6b7280]"
                )}>{label}</span>
              </div>
              {n < 5 && (
                <div className={cn(
                  "mb-4 h-px flex-1 transition-colors",
                  done ? "bg-[#111]" : "bg-neutral-200"
                )} />
              )}
            </Fragment>
          )
        })}
      </div>
      <div className="h-1 w-full overflow-hidden rounded-full bg-neutral-100">
        <div
          className="h-full rounded-full bg-[#111] transition-all duration-300"
          style={{ width: `${(step / 5) * 100}%` }}
        />
      </div>
    </div>
  )
}

// ─── Steps ────────────────────────────────────────────────────────────────────

function Step1({
  f, set, nameError,
}: {
  f: FormState; set: (k: keyof FormState, v: string) => void; nameError: string
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-[#111]">О вашем бизнесе</h3>
          <p className="text-xs text-muted-foreground">
            Основная информация о компании и предлагаемом продукте или услуге
          </p>
        </div>
        <div className="shrink-0 rounded-lg border border-[#eaeaea] bg-amber-50 px-3 py-2 text-xs text-amber-700 max-w-[220px]">
          💡 Совет: Будьте конкретны — это поможет AI предложить более точные решения
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="w-name">
            Название компании / бренда<span className="ml-0.5 text-danger">*</span>
          </Label>
          <Input
            id="w-name"
            value={f.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder="Ваш бренд или компания"
            aria-invalid={!!nameError}
          />
          {nameError && <p className="text-xs text-danger">{nameError}</p>}
        </div>

        <FieldSelect
          id="w-niche"
          label="Отрасль"
          value={f.niche}
          onChange={(v) => set("niche", v)}
          options={INDUSTRY_OPTIONS}
        />

        <FieldText
          id="w-region"
          label="Регион / город"
          value={f.region}
          onChange={(v) => set("region", v)}
          placeholder="Махачкала"
        />

        <FieldText
          id="w-avgcheck"
          label="Средний чек (₽)"
          value={f.avgCheck}
          onChange={(v) => set("avgCheck", v)}
          type="number"
          hint="Средняя сумма одной сделки/продажи"
        />

        <div className="col-span-2">
          <FieldTextarea
            id="w-products"
            label="Продукт / услуга"
            value={f.products}
            onChange={(v) => set("products", v)}
            placeholder="Опишите что продаёте"
            rows={2}
          />
        </div>

        <FieldSelect
          id="w-dealcycle"
          label="Цикл сделки"
          value={f.dealCycle}
          onChange={(v) => set("dealCycle", v)}
          options={DEAL_CYCLE_OPTIONS}
          placeholder="— необязательно —"
        />
      </div>

      <SectionLabel>Голос бренда — необязательно</SectionLabel>
      <div className="grid grid-cols-2 gap-3">
        <FieldSelect
          id="w-brandtone"
          label="Тон коммуникации"
          value={f.brandTone}
          onChange={(v) => set("brandTone", v)}
          options={BRAND_TONE_OPTIONS}
          placeholder="— выберите стиль —"
        />
        <FieldText
          id="w-brandwords"
          label="3 слова, описывающих бренд"
          value={f.brandWords}
          onChange={(v) => set("brandWords", v)}
          placeholder="Прилагательные через запятую"
        />
      </div>
    </div>
  )
}

function Step2({ f, set }: { f: FormState; set: (k: keyof FormState, v: string) => void }) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-[#111]">Целевая аудитория</h3>
        <p className="text-xs text-muted-foreground">Кто ваш клиент и что для него важно</p>
      </div>

      <FieldSelect
        id="w-clienttype"
        label="Тип клиентов"
        value={f.clientType}
        onChange={(v) => set("clientType", v)}
        options={CLIENT_TYPE_OPTIONS}
      />

      <FieldTextarea
        id="w-segments"
        label="Сегменты аудитории"
        value={f.audienceSegments}
        onChange={(v) => set("audienceSegments", v)}
        placeholder="Опишите 1–3 ключевых сегмента"
      />

      <FieldTextarea
        id="w-values"
        label="Что важно клиентам при выборе"
        value={f.clientValues}
        onChange={(v) => set("clientValues", v)}
        placeholder="Цена, гарантия, скорость, качество..."
      />

      <FieldTextarea
        id="w-objections"
        label="Типичные возражения"
        value={f.objections}
        onChange={(v) => set("objections", v)}
        placeholder="Дорого, у других дешевле, не доверяем..."
      />

      <SectionLabel>Язык клиентов — необязательно</SectionLabel>
      <FieldTextarea
        id="w-clientlang"
        label="Как клиенты описывают свою проблему"
        value={f.clientLanguage}
        onChange={(v) => set("clientLanguage", v)}
        placeholder="Дословные фразы из разговоров, WhatsApp, отзывов — AI воспроизведёт этот язык в контенте"
        rows={4}
      />
    </div>
  )
}

function Step3({ f, set }: { f: FormState; set: (k: keyof FormState, v: string) => void }) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-[#111]">Маркетинг сейчас</h3>
        <p className="text-xs text-muted-foreground">Текущие каналы, бюджет и цели продвижения</p>
      </div>

      <FieldTextarea
        id="w-channels"
        label="Текущие каналы продвижения"
        value={f.currentChannels}
        onChange={(v) => set("currentChannels", v)}
        placeholder="Перечислите каналы которые используете сейчас"
        rows={2}
      />

      <div className="grid grid-cols-2 gap-3">
        <FieldText
          id="w-budget"
          label="Ежемесячный бюджет на рекламу (₽)"
          value={f.budget}
          onChange={(v) => set("budget", v)}
          type="number"
          placeholder="500 000"
        />
        <FieldSelect
          id="w-goal"
          label="Главная цель маркетинга"
          value={f.marketingGoal}
          onChange={(v) => set("marketingGoal", v)}
          options={MARKETING_GOAL_OPTIONS}
          placeholder="— необязательно —"
        />
        <div className="col-span-2">
          <FieldText
            id="w-website"
            label="Сайт"
            value={f.website}
            onChange={(v) => set("website", v)}
            type="url"
            placeholder="https://example.com"
          />
        </div>
      </div>

      <SectionLabel>Соцсети и мессенджеры</SectionLabel>
      <div className="grid grid-cols-2 gap-3">
        <FieldText
          id="w-instagram"
          label="Instagram"
          value={f.instagram}
          onChange={(v) => set("instagram", v)}
          type="url"
          placeholder="https://instagram.com/yourpage"
        />
        <FieldText
          id="w-vk"
          label="ВКонтакте"
          value={f.vk}
          onChange={(v) => set("vk", v)}
          type="url"
          placeholder="https://vk.com/yourpage"
        />
        <FieldText
          id="w-telegram"
          label="Telegram"
          value={f.telegram}
          onChange={(v) => set("telegram", v)}
          placeholder="https://t.me/channel или @login"
        />
        <FieldText
          id="w-youtube"
          label="YouTube"
          value={f.youtube}
          onChange={(v) => set("youtube", v)}
          type="url"
          placeholder="https://youtube.com/@channel"
        />
        <FieldText
          id="w-tiktok"
          label="TikTok"
          value={f.tiktok}
          onChange={(v) => set("tiktok", v)}
          type="url"
          placeholder="https://tiktok.com/@yourpage"
        />
        <FieldText
          id="w-other-socials"
          label="Другие каналы"
          value={f.otherSocials}
          onChange={(v) => set("otherSocials", v)}
          placeholder="WhatsApp, Avito, Одноклассники..."
        />
      </div>

      <SectionLabel>Точки на картах — необязательно</SectionLabel>
      <div className="grid grid-cols-2 gap-3">
        <FieldText
          id="w-yandex"
          label="Яндекс Карты"
          value={f.yandexMaps}
          onChange={(v) => set("yandexMaps", v)}
          type="url"
          placeholder="https://yandex.ru/maps/-/..."
          hint="Ссылка на карточку организации"
        />
        <FieldText
          id="w-twogis"
          label="2ГИС"
          value={f.twogis}
          onChange={(v) => set("twogis", v)}
          type="url"
          placeholder="https://2gis.ru/..."
          hint="Ссылка на карточку организации"
        />
      </div>

      <SectionLabel>Доказательства и результаты — необязательно</SectionLabel>
      <FieldTextarea
        id="w-proof"
        label="Ваши ключевые цифры и факты"
        value={f.proofFacts}
        onChange={(v) => set("proofFacts", v)}
        placeholder="AI будет использовать эти факты как доказательства в стратегии и контенте"
        rows={4}
      />
    </div>
  )
}

function Step4({ f, set }: { f: FormState; set: (k: keyof FormState, v: string) => void }) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-[#111]">Экономика и ROI</h3>
      </div>

      <InfoBlock>
        Обязательный блок для расчёта окупаемости. Все цифры считаются в коде на сервере —
        AI видит только готовые метрики и пишет интерпретацию. Без этих данных раздел
        «Окупаемость» в стратегии будет недоступен.
      </InfoBlock>

      <div className="space-y-4">
        <FieldText
          id="w-avgcheck2"
          label="Средний чек (₽)"
          value={f.avgCheck}
          onChange={(v) => set("avgCheck", v)}
          type="number"
          hint="Средняя сумма одной сделки"
        />
        <FieldText
          id="w-margin"
          label="Маржа / прибыль (%)"
          value={f.margin}
          onChange={(v) => set("margin", v)}
          type="number"
          hint="Процент чистой прибыли от суммы сделки после всех расходов кроме рекламы"
        />
        <FieldText
          id="w-conv"
          label="Конверсия заявки в продажу (%)"
          value={f.conversionRate}
          onChange={(v) => set("conversionRate", v)}
          type="number"
          hint="Из 10 заявок сколько становятся клиентами? Например, 2 из 10 = 20%"
        />
        <FieldText
          id="w-cpl"
          label="Текущая стоимость заявки / лида (₽)"
          value={f.currentCpl}
          onChange={(v) => set("currentCpl", v)}
          type="number"
          hint="Сколько вы сейчас платите за одну заявку? Нужно для расчёта ROMI и прогноза"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <FieldText
          id="w-leads"
          label="Заявок в месяц"
          value={f.leadsPerMonth}
          onChange={(v) => set("leadsPerMonth", v)}
          type="number"
        />
        <FieldText
          id="w-sales"
          label="Продаж в месяц"
          value={f.salesPerMonth}
          onChange={(v) => set("salesPerMonth", v)}
          type="number"
        />
      </div>
    </div>
  )
}

function Step5({
  f,
  onAddCompetitor,
  onUpdateCompetitor,
  onRemoveCompetitor,
}: {
  f: FormState
  onAddCompetitor: () => void
  onUpdateCompetitor: (i: number, key: keyof Competitor, val: string) => void
  onRemoveCompetitor: (i: number) => void
}) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-[#111]">Конкуренты</h3>
      </div>

      <InfoBlock>
        Укажите 1–3 конкурента. Анализ строится по введённым данным.
      </InfoBlock>

      <div className="space-y-3">
        {f.competitorsDetailed.map((c, i) => (
          <div key={i} className="relative rounded-xl border border-[#eaeaea] bg-neutral-50 p-4">
            <button
              type="button"
              onClick={() => onRemoveCompetitor(i)}
              className="absolute right-3 top-3 rounded p-0.5 text-muted-foreground hover:text-danger"
            >
              <Trash2 className="size-3.5" />
            </button>
            <p className="mb-3 text-xs font-medium text-[#6b7280]">Конкурент {i + 1}</p>
            <div className="space-y-3">
              <FieldText
                id={`comp-name-${i}`}
                label="Название"
                value={c.name}
                onChange={(v) => onUpdateCompetitor(i, "name", v)}
                placeholder="Название компании"
              />
              <FieldText
                id={`comp-site-${i}`}
                label="Сайт или соцсеть"
                value={c.site}
                onChange={(v) => onUpdateCompetitor(i, "site", v)}
                placeholder="https://competitor.ru или vk.com/competitor"
              />
              <FieldTextarea
                id={`comp-desc-${i}`}
                label="Краткое описание / чем отличаются"
                value={c.description}
                onChange={(v) => onUpdateCompetitor(i, "description", v)}
                placeholder="Что вы знаете об этом конкуренте: цены, каналы, сильные/слабые стороны..."
                rows={2}
              />
            </div>
          </div>
        ))}

        {f.competitorsDetailed.length < 3 && (
          <Button type="button" variant="outline" size="sm" onClick={onAddCompetitor}
            className="w-full">
            <Plus className="size-3.5" />
            Добавить конкурента
          </Button>
        )}
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function CompanyWizard({ project }: { project: Project }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [nameError, setNameError] = useState("")
  const [form, setForm] = useState<FormState>(() => initForm(project))

  function set(key: keyof FormState, value: string) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  function handleOpen() {
    setForm(initForm(project))
    setStep(1)
    setNameError("")
    setOpen(true)
  }

  function handleNext() {
    if (step === 1 && !form.name.trim()) {
      setNameError("Название обязательно")
      return
    }
    setNameError("")
    setStep((s) => Math.min(s + 1, 5))
  }

  function handleBack() {
    setStep((s) => Math.max(s - 1, 1))
  }

  function addCompetitor() {
    if (form.competitorsDetailed.length >= 3) return
    setForm((f) => ({
      ...f,
      competitorsDetailed: [...f.competitorsDetailed, { name: "", site: "", description: "" }],
    }))
  }

  function updateCompetitor(i: number, key: keyof Competitor, val: string) {
    setForm((f) => {
      const next = [...f.competitorsDetailed]
      next[i] = { ...next[i], [key]: val }
      return { ...f, competitorsDetailed: next }
    })
  }

  function removeCompetitor(i: number) {
    setForm((f) => ({
      ...f,
      competitorsDetailed: f.competitorsDetailed.filter((_, idx) => idx !== i),
    }))
  }

  async function handleSave() {
    if (!form.name.trim()) {
      setStep(1)
      setNameError("Название обязательно")
      return
    }
    setLoading(true)
    try {
      const result = await updateProject(project.id, buildPayload(form))
      if (!result.success) {
        toast.error(result.error)
        return
      }
      toast.success("Карточка сохранена")
      setOpen(false)
      router.refresh()
    } catch {
      toast.error("Что-то пошло не так")
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Button variant="outline" size="sm" onClick={handleOpen}>
        <Pencil className="size-3.5" />
        Редактировать карточку
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Карточка компании</DialogTitle>
            <StepperProgress step={step} />
          </DialogHeader>

          <div className="max-h-[58vh] overflow-y-auto pr-1">
            {step === 1 && <Step1 f={form} set={set} nameError={nameError} />}
            {step === 2 && <Step2 f={form} set={set} />}
            {step === 3 && <Step3 f={form} set={set} />}
            {step === 4 && <Step4 f={form} set={set} />}
            {step === 5 && (
              <Step5
                f={form}
                onAddCompetitor={addCompetitor}
                onUpdateCompetitor={updateCompetitor}
                onRemoveCompetitor={removeCompetitor}
              />
            )}
          </div>

          <DialogFooter className="flex-col items-start gap-2 sm:flex-col">
            <p className="text-[11px] text-muted-foreground">
              Данные сохраняются автоматически · Маркетинг и конкуренты — необязательны
            </p>
            <div className="flex w-full items-center justify-end gap-2">
              {step > 1 && (
                <Button variant="outline" size="sm" onClick={handleBack} disabled={loading}>
                  ← Назад
                </Button>
              )}
              {step < 5 ? (
                <Button size="sm" onClick={handleNext}>
                  Далее →
                </Button>
              ) : (
                <Button size="sm" onClick={handleSave} disabled={loading}>
                  {loading && <Loader2 className="size-3.5 animate-spin" />}
                  Сохранить →
                </Button>
              )}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
