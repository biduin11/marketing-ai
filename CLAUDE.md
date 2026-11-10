# AI Marketing OS — CLAUDE.md

> Этот файл читается Claude Code при старте сессии. Не удалять, не перемещать из корня.
> Последнее обновление: Итерация 7 завершена, документ сверен с кодом (ноябрь 2026).

---

## Проект

**Название:** AI Marketing OS
**Репозиторий:** github.com/biduin11/marketing-ai
**Деплой:** Vercel (iad1, Next.js framework preset)
**Текущая итерация:** 7 ✅ — все итерации завершены, идут доработки

---

## Стек (фиксированный)

- **Framework:** Next.js 16 (App Router, Turbopack), React 19
- **Язык:** TypeScript strict — **никаких `any`, `@ts-ignore`, `as any`**
- **Стили:** Tailwind v4, все токены в `app/globals.css` (@theme)
- **UI-компоненты:** shadcn/ui (`components/ui/`)
- **ORM:** Prisma 7 (`@prisma/adapter-pg`) + Postgres (Neon), клиент — `lib/prisma.ts`
- **Auth:** NextAuth v5 — обязательный split:
  - `auth.config.ts` → Edge-совместимый (без Prisma, без bcrypt)
  - `auth.ts` → Node.js (Prisma + bcrypt здесь)
- **AI:** мультипровайдерный роутер `lib/ai/router.ts` (`routeAI`): Anthropic SDK и OpenAI SDK
  через router.cheap, аварийный фолбэк ClaudeHub, опционально Gemini/DeepSeek. Модель под
  задачу и тариф — `lib/ai/models.ts`. Structured output + zod-валидация
- **Env-валидация:** `@t3-oss/env-nextjs` (`env.mjs`)
- **Тесты:** Vitest (`npm test`)
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
    page.tsx        ← Command Center (главная: метрики, AI Директор, онбординг)
    director/       ← AI Marketing Director (ежедневный анализ)
    inbox/          ← Входящие (сигналы InboxSignal от cron директора)
    audit/          ← Экспресс-аудит
    company/        ← «Бренд»: анализ компании, SWOT, позиционирование, вкладки «Рынок»/«Продукт»
    competitors/
    audience/       ← «Клиент»: сегменты, портреты, JTBD, боли, триггеры, инсайты
    journey/        ← «Путь клиента» (CJM) — отдельная страница
    offers/         ← офферы + УТП под площадку
    strategy/       ← стратегия 30/90/180/365
    sprint/         ← спринт-планировщик
    content/        ← Content Factory (контент-план, площадки, тексты постов)
    briefs/         ← шаблоны брифов
    analytics/      ← метрики, сравнение периодов, калькулятор окупаемости
    reputation/     ← отзывы/упоминания + анализ
    reports/        ← отчёты (неделя/месяц/квартал)
    campaigns/      ← заглушка (EmptyState), в меню нет
    settings/       ← профиль, тариф/оплата, Яндекс.Метрика, доступ клиента
  client/[token]/   ← кабинет клиента (read-only, вход по токену ClientAccess)
  api/
    auth/           ← NextAuth
    yookassa/webhook/
    cron/           ← director, generate-sprints, sync-yandex-metrika, expire-plans
    admin/seed-skills/ ← заливка marketing-skills в pgvector (заголовок x-seed-secret)

lib/
  nav.ts            ← меню sidebar (группы INTELLIGENCE/STRATEGY/EXECUTION/RESULTS)
  prisma.ts         ← Prisma client singleton
  gates.ts          ← проверка тарифа/лимитов перед AI-вызовом
  marketing-skills.ts, skill-*.ts ← сборка system prompt из lib/marketing-skills/*.md
  marketing-skills/ ← база знаний маркетинговых скилов (.md)
  ai/
    router.ts       ← routeAI: выбор провайдера + фолбэк
    models.ts       ← модель по задаче и тарифу
    client.ts, *-client.ts, generate-with-*.ts ← провайдеры
    prompts/        ← промты по типу анализа
    schemas/        ← zod-схемы AI-выводов
    knowledge/      ← psychotypes-skill.md
  actions/          ← Server Actions (вся мутация)
  services/         ← бизнес-логика (в т.ч. tavily, reputation-search, yookassa, usage)
  config/plans.ts   ← тарифы и лимиты
  security/         ← шифрование токенов
  validations/      ← zod-схемы форм
  store/            ← Zustand

components/
  ui/               ← shadcn/ui (не трогать вручную)
  app-sidebar.tsx, app-header.tsx, empty-state.tsx, upgrade-gate.tsx …
  shared/           ← общие блоки
  [feature]/        ← компоненты конкретного модуля

prisma/
  schema.prisma
  migrations/*.sql  ← SQL для ручного применения в Neon
```

---

## База данных (текущая схема)

### Применённые модели
- `User` — id, email, name, passwordHash, plan (Plan), planExpiresAt, createdAt, updatedAt
- `Project` — id, userId, name, niche, website, socials (Json), regions (String[]),
  products (String[]), competitors (String[]), budget (Int?), goals, status (ProjectStatus), timestamps.
  Расширенный профиль (Итерация 7): industry, dealCycle, brandTone, brandWords, clientType,
  audienceSegments, clientValues, objections, clientLanguage, currentChannels, marketingGoal,
  socialLinks, proofFacts, margin, conversionRate, currentCpl, leadsPerMonth, salesPerMonth,
  avgCheck (Int?), competitorsDetailed (Json?), productsDetailed (Json?)
- `CustomChannel` — id, projectId, name, createdAt (unique [projectId, name]) — пользовательские
  каналы для метрик
- `InboxSignal` — id, projectId, type (SignalType), priority (SignalPriority), title, body,
  action?, actionHref?, read, createdAt (index [projectId, read]). Сигналы создаёт cron
  `/api/cron/director` (`createSignal` в `lib/actions/inbox.ts`), показываются на странице
  «Входящие». SQL: `prisma/migrations/inbox_experiments.sql`
- `SkillChunk` (таблица `skill_chunks`) — id, skillSlug, section, content, tokenCount,
  embedding vector(1536). Фрагменты «тяжёлых» marketing-skills для RAG; заполняется через
  `POST /api/admin/seed-skills`. Нужен только при `SKILL_RETRIEVAL_MODE=vector`
  (по умолчанию `lexical` — поиск по файлам без эмбеддингов)
- `AiArtifact` — id, projectId, type (ArtifactType), version, payload (Json),
  model, inputHash, createdAt
- `StrategyTask` — id, projectId, artifactId, taskKey, done (Boolean), updatedAt
  (состояние чекбоксов задач стратегии; unique [artifactId, taskKey])
- `Metric` — id, projectId, channel, date (Date), spend, revenue (Float), leads, clicks, impressions (Int),
  createdAt, updatedAt (unique [projectId, channel, date]; index [projectId])
- `ContentPlatform` — id, projectId, name, share (Int?, доля публикаций 0-100), order (Int),
  createdAt, updatedAt (unique [projectId, name]; index [projectId])
  Управляемые площадки контент-плана (вкладка «Площадки»). Входят в `inputHash` генерации
  CONTENT_PLAN и передаются в промт — AI распределяет контент по ним с учётом долей.
- `ReputationSnapshot` — id, projectId, payload (Json), model, createdAt (index [projectId, createdAt])
  Результат AI-анализа репутации: поиск через Tavily (`lib/services/tavily.service.ts`),
  результаты вставляются текстом в промт, затем анализ через Anthropic/openai-совместимый роутер
  (без интеграций и парсинга сайтов напрямую). Каждый запуск («Обновить» на странице «Репутация»)
  создаёт новый снапшот; версий/кэша по inputHash нет — генерация запускается только вручную,
  т.к. использует Tavily-поиск. Для карточек на Яндекс.Картах / 2ГИС читается вкладка отзывов
  (`lib/services/reputation-search.ts`), по отзывам строится анализ точек роста.
- `Sprint` — id, projectId, weekStart, weekEnd, aiSummary, timestamps
- `SprintTask` — id, sprintId, title, description, priority, category, estimatedHours,
  completed, dueDay, timestamps
- `Brief` — id, projectId, type (BriefType), title, content (Json), timestamps
- `ClientAccess` — id, projectId, token (unique), clientName, clientEmail, isActive,
  expiresAt, lastVisitAt, createdAt
- `ExpressAudit` — id, projectId, answers (Json), score, level, growthPoints (Json),
  quickWins (Json), createdAt
- `YandexMetrikaIntegration` — id, projectId (unique), counterId, accessToken (зашифрован
  AES-256-GCM, `lib/security/token-crypto.ts`), isActive, lastSyncAt, syncError, timestamps.
  Настраивается на странице «Настройки». Автосинхронизация — `/api/cron/sync-yandex-metrika`
  каждый день в 06:00 UTC (vercel.json), плюс ручная кнопка «Синхронизировать сейчас».
  Импортирует визиты/пользователей/достижения целей по источникам трафика в `Metric`
  (clicks/impressions/leads); spend/revenue не трогает — вносятся вручную.
- `Payment` — id, userId, yookassaId (unique), plan (Plan), amount (Int, копейки),
  status (PaymentStatus), paidAt, expiresAt, createdAt (index [userId]).
  Оплата через ЮKassa — разовые платежи без автосписания, тариф выдаётся на 30 дней.
  `createPayment` (`lib/actions/billing.ts`) создаёт платёж и запись `PENDING`; подтверждение
  идёт двумя путями — вебхук `app/api/yookassa/webhook/route.ts` (перезапрашивает статус у
  ЮKassa по id, телу запроса не доверяет) и `checkPaymentStatus`, который дергается со страницы
  `/settings` после возврата с оплаты. Оба пишут `User.plan` + `User.planExpiresAt` (+30 дней).
  Истечение — лениво через `getEffectivePlan()` (`lib/config/plans.ts`, используется в
  `lib/gates.ts` и `lib/services/usage.service.ts` при каждой проверке лимитов) и backup-cron
  `/api/cron/expire-plans` (ежедневно 06:00 UTC), который возвращает `plan` на FREE и обнуляет
  `planExpiresAt`. `planExpiresAt: null` означает «без срока» (ручной MAX/PRO), а не «истёк».
  Тарифы (`PLAN_LIMITS`): FREE — 1 проект, 15 генераций/мес, без веб-поиска; PRO — 1799 ₽,
  10 проектов, 100 генераций; MAX — 3699 ₽, без лимитов.

> MARKET_ANALYSIS — вкладка «Рынок» на странице «Анализ компании» (`/company`). Размер и рост
  рынка, конкуренты, угрозы/возможности, сезонность спроса и цен, AI-инсайт — поиск через Tavily,
  результаты текстом в промте, анализ через роутер. Кэш по inputHash, генерация только по кнопке
  «Сгенерировать»/«Регенерировать».

> PRODUCT_ANALYSIS — вкладка «Продукт» на странице «Анализ компании» (`/company`). BCG-матрица,
  жизненный цикл, ABC-анализ ассортимента, возможности развития, продуктовая стратегия — без
  web_search (данные из анкеты, поле `Project.productsDetailed`: `[{name, margin, salesShare,
  stage}]`, шаг «Бизнес»). Кэш по inputHash.

> DIRECTOR_DAILY — ежедневный снапшот AI-анализа (problems/opportunities/risks/priorities).
> Cron: `/api/cron/director` каждый день в 06:00 UTC (vercel.json). Защита: `CRON_SECRET` env.
> Тот же cron создаёт сигналы `InboxSignal` для страницы «Входящие».

> CJM — отдельная страница «Путь клиента» (`/journey`). Раньше была вкладкой на `/audience`;
> старые ссылки `/audience?tab=cjm` редиректят на `/journey`.

> PLATFORM_UTP — генератор УТП под площадку (`lib/services/platform-utp.service.ts`).

> Спринты генерируются автоматически: `/api/cron/generate-sprints` по воскресеньям 18:00 UTC.

> Страницы «Гипотезы» (`/hypotheses`) и «Возражения» (`/objections`) удалены (модели `Hypothesis`,
  `Objection`, `ObjectionResponse` и enum'ы `HypothesisStatus`/`HypothesisResult` — тоже; SQL см.
  `prisma/migrations/remove_hypotheses_objections.sql`). Общий список психотипов, которым
  пользовались ответы на возражения, вынесен в `lib/ai/schemas/psychotypes.ts` — от него
  по-прежнему зависят Брифы (`lib/actions/briefs.ts`, `components/briefs/briefs-view.tsx`).

**Enum ProjectStatus:** DRAFT | ACTIVE | PAUSED | ARCHIVED
**Enum ArtifactType:** COMPANY_ANALYSIS | SWOT | POSITIONING | GROWTH_POINTS |
  STRATEGY_30 | STRATEGY_90 | STRATEGY_180 | STRATEGY_365 |
  AUDIENCE_SEGMENTS | BUYER_PERSONA | JTBD | COMPETITOR_ANALYSIS | OFFER |
  CJM | CONTENT_PLAN | REPORT_WEEKLY | REPORT_MONTHLY | REPORT_QUARTERLY | DIRECTOR_DAILY |
  REPUTATION_ANALYSIS | MARKET_ANALYSIS | PRODUCT_ANALYSIS | PLATFORM_UTP
**Enum Plan:** FREE | PRO | MAX
**Enum PaymentStatus:** PENDING | SUCCEEDED | CANCELED | REFUNDED
**Enum BriefType:** VIDEO | DESIGN_POST | DESIGN_STORY | LANDING | PHOTO | COPYWRITING
**Enum SignalType:** ANOMALY | MARKET | STRATEGY | CONTENT | COMPETITOR | EXPERIMENT | SYSTEM
**Enum SignalPriority:** HIGH | MEDIUM | LOW

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

### Marketing-skills (база знаний в промтах)

`lib/marketing-skills.ts` собирает system prompt из `.md`-файлов `lib/marketing-skills/`:
лёгкие скилы подставляются целиком, тяжёлые — top-K фрагментов (лексический поиск по файлам,
либо pgvector при `SKILL_RETRIEVAL_MODE=vector`). Привязка модуль → скилы — в том же файле.
Подключено к CJM, офферам, контент-плану, аудитории, конкурентам, экспресс-аудиту, брифам,
спринтам и анализу компании.
- `buyerPersonaSchema` расширена полями `psychotype` (enum) и `psychotypeReason`
  (оба `.optional()` — для обратной совместимости со старыми артефактами)

---

## Дизайн-система — Finexy (токены в `app/globals.css`)

> Дизайн-система полностью заменена на Finexy (fintech/SaaS-референс). Референсные файлы
> (`design-tokens.css`, `tailwind.config.js` — v3-синтаксис, не используется напрямую, т.к.
> проект на Tailwind v4 CSS-first) смёржены в CSS-переменные `app/globals.css`.

```
Фон страницы:  #F0F0F0
Карточки:      #FFFFFF  border: #EAEAEA
Текст:         #17171A  / muted: #8B8D98
Primary btn:   #1A1A1A (чёрная, белый текст) — rounded-full
Brand-акцент:  #FF5A1F (--brand) — точечно: CTA, выделенные карточки, основная серия графика.
               НЕ красить в акцент каждую кнопку — только когда нужен явный highlight.
Success:       #16A34A (bg #DCFCE7)  Warning: #F59E0B (bg #FEF3C7)  Danger: #EF4444 (bg #FEE2E2)
Радиус:        --radius-sm 8px / md 12px / lg 16px / xl 20px / 2xl 24px / full 9999px
               Кнопки, инпуты, бейджи, активный nav — rounded-full. Карточки — rounded-xl/2xl.
Тени:          --shadow-sm / --shadow-card / --shadow-md / --shadow-popover
Шрифт:         Inter (next/font/google), --font-sans = --font-heading (единый, без пары)
Тип-шкала:     text-display 32px / text-h1 28px / text-h2 20px / text-h3 16px /
               text-caption 12px / text-micro 11px (токены в `@theme`, globals.css)
```

Карточки: `bg-card rounded-xl shadow-[var(--shadow-card)] p-6` (или через `<Card>` из `components/ui/card.tsx`)
Sidebar: светлый (`bg-sidebar` = белый), активный пункт — `bg-sidebar-accent rounded-full`
  (тёмная пилюля, белый текст/иконка) — см. `components/app-sidebar.tsx`.
  Состав меню — `lib/nav.ts`: Command Center, AI Директор, Входящие | INTELLIGENCE (Аудит,
  Бренд, Конкуренты, Клиент, Путь клиента, Офферы) | STRATEGY (Стратегия, Спринт) |
  EXECUTION (Контент, Брифы) | RESULTS (Аналитика, Репутация, Отчёты) | Настройки.
Графики Recharts: `--chart-1` (brand orange, основная серия) → `--chart-2..5` (тёмный→серый),
  без произвольных hex в компонентах — только `var(--chart-N)`.

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
ANTHROPIC_API_KEY=     # ключ router.cheap (НЕ обязательно родной ключ Anthropic — router.cheap
                       # проксирует нативный Anthropic-формат запросов, НО не нативный
                       # web_search_20250305 tool — для Market/Competitors/Reputation поиск
                       # идёт через Tavily (TAVILY_API_KEY), см. ниже).
                       # Используется задачами на claude-sonnet-4-6 в lib/ai/models.ts (Company
                       # Analysis, SWOT, Strategy, Positioning, Market, Competitors, Reputation).
ANTHROPIC_BASE_URL=    # URL Anthropic-совместимого эндпоинта router.cheap (см. кабинет router.cheap).
                       # Без него ANTHROPIC_API_KEY трактуется как родной ключ Anthropic и запросы
                       # идут на api.anthropic.com напрямую — модель claude-sonnet-4-6 (в том виде,
                       # в каком её раздаёт router.cheap) там не существует.
OPENAI_API_KEY=        # тот же (или другой) ключ router.cheap — используется задачами на
                       # gpt-6.1-sol/gpt-5.4-mini в lib/ai/models.ts (CJM, Audience, Product, Offers,
                       # Content Plan, Director, Report, чат-ассистент, копирайтинг постов и др.).
OPENAI_BASE_URL=       # URL OpenAI-совместимого эндпоинта router.cheap. Без него — обращение к
                       # api.openai.com напрямую. Для gpt-6.1-sol используется /v1/responses.
GEMINI_API_KEY=        # опционально — используется только при AI_PROVIDER=gemini (чат-ассистент
                       # и генерация текста постов, см. ниже). Больше НЕ автофолбэк роутера
                       # (lib/ai/router.ts) — эту роль занял CLAUDEHUB_API_KEY, см. ниже.
CLAUDEHUB_API_KEY=     # опционально — аварийный автофолбэк роутера (lib/ai/router.ts), если
                       # основной вызов через router.cheap упадёт (rate limit/timeout/outage/
                       # отсутствующий ключ). Ключ вида sk-hub-... с app.claudehub.fun, один
                       # работает и в Anthropic-, и в OpenAI-совместимом режиме (см.
                       # lib/ai/claudehub-client.ts, lib/ai/generate-with-claudehub.ts). Участвует
                       # и в задачах Market/Competitors/Reputation — их веб-поиск (Tavily) не
                       # привязан к провайдеру, так что ClaudeHub получает тот же текстовый промт
                       # с результатами. Без ключа routeAI просто пробрасывает исходную ошибку.
AI_PROVIDER=           # "gemini" — принудительно переключает чат-ассистент и генерацию текста
                       # постов на Gemini вместо router.cheap (см. lib/actions/chat.ts,
                       # lib/actions/content-write.ts). Пусто/не задано = router.cheap (по умолчанию).
TAVILY_API_KEY=           # ключ Tavily Search API (tavily.com) — веб-поиск для Market/Competitors/
                          # Reputation (lib/services/tavily.service.ts), результаты вставляются
                          # текстом в промт перед вызовом routeAI (заменил нативный Anthropic
                          # web_search_20250305 — router.cheap его не проксирует).
BLOB_READ_WRITE_TOKEN=    # (нужен с Итерации 4)
YOOKASSA_SHOP_ID=         # ID магазина из личного кабинета ЮKassa (yookassa.ru)
YOOKASSA_SECRET_KEY=      # Секретный ключ из личного кабинета ЮKassa
NEXT_PUBLIC_APP_URL=      # https://твой-домен.vercel.app (используется в return_url платежей и cron)
CRON_SECRET=              # случайная строка для защиты /api/cron/director, /api/cron/sync-yandex-metrika
                          # и /api/cron/expire-plans
ENCRYPTION_KEY=           # случайная строка (openssl rand -hex 32) — шифрование OAuth-токена Яндекс.Метрики
DEEPSEEK_API_KEY=         # опционально — провайдер DeepSeek (lib/ai/client.ts); сейчас ни одна задача
                          # на него не маршрутизируется
SKILL_RETRIEVAL_MODE=     # "lexical" (по умолчанию) | "vector" — поиск фрагментов marketing-skills
EMBEDDING_API_KEY=        # опционально, только для vector-режима; по умолчанию = OPENAI_API_KEY
EMBEDDING_BASE_URL=       # опционально; по умолчанию = OPENAI_BASE_URL
EMBEDDING_MODEL=          # опционально; по умолчанию text-embedding-3-small (1536 измерений)
SEED_SECRET=              # секрет заголовка x-seed-secret для POST /api/admin/seed-skills
SKIP_ENV_VALIDATION=      # "1" — пропустить валидацию env.mjs (локальная сборка/CI)
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
| 7 | Дополнительные модули (спринт, брифы, УТП) | ✅ Завершена |

Модули Итерации 7 реализованы и задеплоены (7 из исходных 9 — «Трекер гипотез» и «База возражений»
удалены: страницы падали с ошибкой, ценность модулей была неясна):
✅ Калькулятор окупаемости
✅ Генератор УТП под площадку
✅ Шаблоны брифов
✅ Дашборд сравнения периодов
✅ Спринт-планировщик
✅ Экспресс-аудит
✅ Кабинет клиента (read-only)

Не реализовано: страница «Кампании» (`/campaigns`) — заглушка, в меню не выведена.

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
