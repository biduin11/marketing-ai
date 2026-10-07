# AI Marketing OS

Веб-приложение для управления маркетингом: аудит компании и рынка,
сегментация аудитории, анализ конкурентов, офферы, CJM, контент-план,
аналитика, спринты, отчёты и рекомендации AI-директора.

## Стек

- Next.js 16, React 19, TypeScript
- Tailwind CSS 4 и shadcn/ui
- Prisma 7 и PostgreSQL (Neon)
- Auth.js / NextAuth 5
- OpenAI, Anthropic и Gemini
- Zustand, Recharts, Vercel Blob

## Локальный запуск

Требуется актуальная LTS-версия Node.js и доступная PostgreSQL.

```bash
npm ci
npm run dev
```

Приложение будет доступно по адресу
[http://localhost:3000](http://localhost:3000).

Минимальный `.env.local`:

```dotenv
DATABASE_URL=postgresql://...
AUTH_SECRET=...
AUTH_URL=http://localhost:3000
ANTHROPIC_API_KEY=...
```

Дополнительные интеграции включаются соответствующими переменными:

```dotenv
ANTHROPIC_BASE_URL=
OPENAI_API_KEY=
OPENAI_BASE_URL=
GEMINI_API_KEY=
DEEPSEEK_API_KEY=
TAVILY_API_KEY=
AI_PROVIDER=

CRON_SECRET=
ENCRYPTION_KEY=
BLOB_READ_WRITE_TOKEN=

YOOKASSA_SHOP_ID=
YOOKASSA_SECRET_KEY=
NEXT_PUBLIC_APP_URL=
```

## Проверки

По умолчанию тяжёлые skills ищутся по словам и заголовкам в файлах
`lib/marketing-skills/*.md`. Это не требует API эмбеддингов, отдельного ключа
или заполнения `skill_chunks` и работает с router.cheap. Если совпадений нет,
используются первые разделы skill. Поиск по словам не учитывает синонимы
и переводы так, как семантический поиск.

Для необязательного векторного поиска можно настроить отдельный API эмбеддингов:

```dotenv
SKILL_RETRIEVAL_MODE=vector
EMBEDDING_API_KEY=...
EMBEDDING_BASE_URL=https://api.openai.com/v1
EMBEDDING_MODEL=text-embedding-3-small
```

Ключ должен принадлежать выбранному провайдеру. В режиме `vector`, если
настройки `EMBEDDING_*` не заданы, используются `OPENAI_API_KEY`,
`OPENAI_BASE_URL` и модель `text-embedding-3-small`.
Если роутер возвращает 404, проверьте доступные модели через его `GET /v1/models`.
Модель должна поддерживать embeddings и возвращать 1536 измерений.
Индексация и поиск используют одну конфигурацию; после смены модели нужно
заново загрузить все skills. Старые чанки сохраняются при ошибке API,
а замена данных одного skill выполняется в транзакции.

```bash
npm run lint
npm test
npx tsc --noEmit
npm run build
npm audit --omit=dev
```

## Структура

- `app/` — маршруты, layouts, route handlers и cron endpoints.
- `components/` — UI и компоненты предметных модулей.
- `lib/actions/` — Server Actions, валидация запросов и контроль доступа.
- `lib/services/` — бизнес-логика.
- `lib/ai/` — маршрутизация AI-провайдеров, промпты и Zod-схемы.
- `prisma/schema.prisma` — схема данных.

Защищённые действия должны повторно проверять сессию и принадлежность
ресурса пользователю. AI-ответы валидируются Zod-схемами до сохранения.

## База данных

Проект не запускает миграции автоматически при сборке или деплое.
Изменения схемы применяются вручную в Neon SQL Editor, после чего
обновляется Prisma Client:

```bash
npx prisma generate
```

Не добавляйте `prisma migrate deploy` в build-скрипты.

## Деплой

Приложение рассчитано на Vercel. Расписания cron находятся в
`vercel.json`; все cron endpoints защищаются через `CRON_SECRET`.
Переменные окружения для production задаются в настройках проекта Vercel.
