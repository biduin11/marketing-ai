# AI Marketing OS — CLAUDE.md

> Этот файл читается Claude Code при старте сессии. Не удалять, не перемещать из корня.
> Последнее обновление: Итерация 6 завершена.

---

## Проект

**Название:** AI Marketing OS
**Репозиторий:** github.com/biduin11/marketing-ai
**Деплой:** Vercel (iad1, Next.js framework preset)
**Текущая итерация:** 6 ✅ — все итерации завершены

---

## Стек (фиксированный)

- **Framework:** Next.js 16 (App Router, Turbopack)
- **Язык:** TypeScript strict — **никаких `any`, `@ts-ignore`, `as any`**
- **Стили:** Tailwind v4, все токены в `app/globals.css` (@theme)
- **UI-компоненты:** shadcn/ui (`components/ui/`)
- **ORM:** Prisma + Postgres (Neon)
- **Auth:** NextAuth v5 — обязательный split:
  - `auth.config.ts` → Edge-совместимый (без Prisma, без bcrypt)
  - `auth.ts` → Node.js (Prisma + bcrypt здесь)
- **AI:** Anthropic SDK (`lib/ai/client.ts`), structured output через tool use + zod
- **Состояние:** Zustand
- **Графики:** Recharts (монохром, без градиентов)
- **Файлы:** Vercel Blob
- **БД:** Neon (Postgres) — **миграции ТОЛЬКО вручную через Neon SQL Editor**

---

## Архитектура (где что живёт)

```
app/
  (auth)/           ← login, register — без sidebar
  (app)/            ← защищённые роуты, общий layout с sidebar
    layout.tsx      ← Server Component, sidebar + project switcher
    dashboard/      ← Главная (AI Директор, метрики)
    company/        ← Company Intelligence
    audience/
    competitors/
    offers/
    journey/        ← CJM
    content/        ← Content Factory
    analytics/
    reports/
    director/       ← AI Marketing Director
    settings/
  api/              ← только webhooks (Stripe) и AI-стриминг если нужен

lib/
  ai/
    client.ts       ← Anthropic SDK singleton
    prompts/        ← промты по типу анализа
    schemas/        ← zod-схемы AI-выводов
  actions/          ← Server Actions (вся мутация)
  services/         ← бизнес-логика
  db/               ← Prisma client singleton
  validations/      ← zod-схемы форм

components/
  ui/               ← shadcn/ui (не трогать вручную)
  shared/           ← AppSidebar, MetricCard, AiPanel, EmptyState, ScoreCard
  [feature]/        ← компоненты конкретного модуля

prisma/
  schema.prisma
```

---

## База данных (текущая схема)

### Применённые модели (Итерации 0–4)
- `User` — id, email, name, passwordHash, createdAt, updatedAt
- `Project` — id, userId, name, niche, website, socials (Json), regions (String[]),
  products (String[]), competitors (String[]), budget (Int), goals, status (ProjectStatus), timestamps
- `AiArtifact` — id, projectId, type (ArtifactType), version, payload (Json),
  model, inputHash, createdAt
- `StrategyTask` — id, projectId, artifactId, taskKey, done (Boolean), updatedAt
  (состояние чекбоксов задач стратегии; unique [artifactId, taskKey])
- `Metric` — id, projectId, channel, date (Date), spend, revenue (Float), leads, clicks, impressions (Int),
  createdAt, updatedAt (unique [projectId, channel, date]; index [projectId])

> DIRECTOR_DAILY — ежедневный снапшот AI-анализа (problems/opportunities/risks/priorities).
> Cron: `/api/cron/director` каждый день в 06:00 UTC (vercel.json). Защита: `CRON_SECRET` env.

**Enum ProjectStatus:** DRAFT | ACTIVE | PAUSED | ARCHIVED
**Enum ArtifactType:** COMPANY_ANALYSIS | SWOT | POSITIONING | GROWTH_POINTS |
  STRATEGY_30 | STRATEGY_90 | STRATEGY_180 | STRATEGY_365 |
  AUDIENCE_SEGMENTS | BUYER_PERSONA | JTBD | COMPETITOR_ANALYSIS | OFFER |
  CJM | CONTENT_PLAN | REPORT_WEEKLY | REPORT_MONTHLY | REPORT_QUARTERLY | DIRECTOR_DAILY (расширяется с каждой итерацией)

> Примечание: анализ компании сохраняется одним композитным `COMPANY_ANALYSIS`
> (payload включает SWOT/позиционирование/точки роста). Активный проект — в cookie
> `active-project` (читается Server Components) + Zustand для мгновенного UI.

---

## Правила работы с БД

1. **НЕ запускать** `prisma migrate deploy` в build-команде или скриптах деплоя
2. После изменения `schema.prisma` — дать мне готовый SQL отдельным блоком
3. Я применяю SQL вручную в Neon SQL Editor, затем говорю «SQL применён»
4. Только после этого — `prisma generate` и продолжение работы

---

## AI-слой (ключевые принципы)

- Генерация — **только по явному действию пользователя** (кнопка)
- Результат сохраняется в `AiArtifact` (тип + версия + payload)
- При повторной генерации — новая версия, старая сохраняется
- Кэш по `inputHash`: если вход не изменился — не регенерировать
- **Никогда не генерировать при рендере страницы**
- Все AI-выводы должны проходить через zod-валидацию перед сохранением

### Система психотипов покупателей

В системные промты встроена модель из 4 психотипов: **Традиционалист**, **Независимый**,
**Эстет**, **Гедонист**. В реальной аудитории доминируют 1-2 типа — промт запрещает «угождать всем 4».

- Источник знаний: `lib/ai/knowledge/psychotypes-skill.md`
- Общий блок экспортируется как `psychotypesBlock` из `lib/ai/prompts/audience.ts`
  (единый источник; остальные промты импортируют его)
- Подключён в модулях: **Аудитория** (segments + buyer persona), **Стратегия**, **Контент-план**, **Офферы**
- `buyerPersonaSchema` расширена полями `psychotype` (enum) и `psychotypeReason`
  (оба `.optional()` — для обратной совместимости со старыми артефактами)

---

## Дизайн-система (токены в `app/globals.css`)

```
Фон страницы:  #fafafa
Карточки:      #ffffff  border: #eaeaea
Текст:         #111111  / muted: #6b7280
Primary btn:   #111111 (чёрная, белый текст)
Success:       #16a34a  Warning: #d97706  Danger: #dc2626
Радиус:        карточки rounded-2xl, контролы rounded-lg
Шрифт:         Geist Sans (next/font)
```

Карточки: `bg-white border border-[#eaeaea] rounded-2xl p-6 shadow-sm`
Sidebar: 240px, активный пункт — `bg-neutral-100 rounded-lg`
Графики Recharts: монохром, линии `#111`, без заливок, тонкая сетка `#eaeaea`

---

## Принципы кода (обязательно)

✅ **Всегда:**
- TypeScript strict, явные типы возврата у функций
- Zod на входе всех Server Actions
- Loading / Error / Empty state в каждом UI-блоке
- Server Components по умолчанию, `'use client'` только где необходима интерактивность
- Бизнес-логика только в `/lib`, никогда в компонентах
- Prisma-типы напрямую (`import type { Project } from "@prisma/client"`)

❌ **Никогда:**
- `any`, `@ts-ignore`, `as any`
- Prisma-импорты в `auth.config.ts` (Edge)
- `prisma migrate deploy` в билде
- `console.log` в production-коде
- Бизнес-логика в React-компонентах
- Генерация AI при рендере

---

## Переменные окружения (`.env` + Vercel)

```
DATABASE_URL=          # Neon connection string
AUTH_SECRET=           # openssl rand -base64 32
AUTH_URL=              # https://твой-домен.vercel.app (на проде)
ANTHROPIC_API_KEY=     # sk-ant-...  (нужен с Итерации 1)
BLOB_READ_WRITE_TOKEN=    # (нужен с Итерации 4)
STRIPE_SECRET_KEY=        # (нужен с Итерации 6)
STRIPE_WEBHOOK_SECRET=    # (нужен с Итерации 6)
STRIPE_PRO_PRICE_ID=      # price_xxx из Stripe Dashboard (нужен с Итерации 6)
NEXT_PUBLIC_APP_URL=      # https://твой-домен.vercel.app (нужен с Итерации 6)
CRON_SECRET=              # случайная строка для защиты /api/cron/director и /api/cron/sync-integrations
INTEGRATION_ENCRYPTION_KEY= # 32 байта hex (openssl rand -hex 32) — шифрование accessToken интеграций
```

---

## Статус итераций

| # | Итерация | Статус |
|---|---|---|
| 0 | Фундамент (каркас, auth, БД, деплой) | ✅ Завершена |
| 1 | Company Intelligence + Strategy Engine | ✅ Завершена |
| 2 | Audience + Competitor + Offer | ✅ Завершена |
| 3 | CJM + Content Factory | ✅ Завершена |
| 4 | Analytics + Reports | ✅ Завершена |
| 5 | AI Marketing Director | ✅ Завершена |
| 6 | SaaS (биллинг, лимиты) | ✅ Завершена |

---

## Как обновлять этот файл

После завершения каждой итерации обновляй:
1. **«Текущая итерация»** в шапке
2. **«База данных»** — добавь новые модели в «Применённые»
3. **«Статус итераций»** — поменяй ⏳ на ✅
4. Добавь новые env-переменные если появились

Команда для Claude Code после завершения итерации:
```
Обнови CLAUDE.md: итерация [N] завершена. Добавь новые модели БД
в раздел «Применённые», обнови статус итерации, добавь новые env если появились.
```

## graphify

This project has a knowledge graph at graphify-out/ with ключевые узлы, community structure, and cross-file relationships.

Rules:
- For codebase questions, first run `graphify query "<question>"` when graphify-out/graph.json exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).
