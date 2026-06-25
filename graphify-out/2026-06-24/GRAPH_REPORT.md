# Graph Report - marketing_ai  (2026-06-24)

## Corpus Check
- 130 files · ~30,438 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 639 nodes · 1478 edges · 35 communities (28 shown, 7 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 13 edges (avg confidence: 0.86)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `92d5d5be`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- [[_COMMUNITY_AI Server Actions|AI Server Actions]]
- [[_COMMUNITY_App Layout & Navigation|App Layout & Navigation]]
- [[_COMMUNITY_Auth & Project Actions|Auth & Project Actions]]
- [[_COMMUNITY_Page Components & Routing|Page Components & Routing]]
- [[_COMMUNITY_Dependencies & Package Config|Dependencies & Package Config]]
- [[_COMMUNITY_Project Architecture Docs|Project Architecture Docs]]
- [[_COMMUNITY_Strategy & Utils|Strategy & Utils]]
- [[_COMMUNITY_Company Intelligence UI|Company Intelligence UI]]
- [[_COMMUNITY_Content Factory UI|Content Factory UI]]
- [[_COMMUNITY_Audience Module UI|Audience Module UI]]
- [[_COMMUNITY_Component Aliases & Config|Component Aliases & Config]]
- [[_COMMUNITY_TypeScript Config|TypeScript Config]]
- [[_COMMUNITY_Root Layout & Providers|Root Layout & Providers]]
- [[_COMMUNITY_Public SVG Assets|Public SVG Assets]]
- [[_COMMUNITY_AI Client & Env|AI Client & Env]]
- [[_COMMUNITY_NextAuth Type Extensions|NextAuth Type Extensions]]
- [[_COMMUNITY_ESLint Config|ESLint Config]]
- [[_COMMUNITY_Next.js Config|Next.js Config]]
- [[_COMMUNITY_PostCSS Config|PostCSS Config]]
- [[_COMMUNITY_Auth API Route|Auth API Route]]
- [[_COMMUNITY_Community 21|Community 21]]
- [[_COMMUNITY_Community 22|Community 22]]
- [[_COMMUNITY_Community 23|Community 23]]
- [[_COMMUNITY_Community 24|Community 24]]
- [[_COMMUNITY_Community 25|Community 25]]
- [[_COMMUNITY_Community 26|Community 26]]
- [[_COMMUNITY_Community 27|Community 27]]
- [[_COMMUNITY_Community 28|Community 28]]
- [[_COMMUNITY_Community 29|Community 29]]
- [[_COMMUNITY_Community 30|Community 30]]
- [[_COMMUNITY_Community 31|Community 31]]
- [[_COMMUNITY_Community 32|Community 32]]
- [[_COMMUNITY_Community 33|Community 33]]
- [[_COMMUNITY_Community 34|Community 34]]

## God Nodes (most connected - your core abstractions)
1. `cn()` - 77 edges
2. `getLatestArtifact()` - 39 edges
3. `EmptyState()` - 25 edges
4. `getActiveProjectId()` - 23 edges
5. `computeInputHash()` - 22 edges
6. `Button()` - 21 edges
7. `generateStructured()` - 21 edges
8. `getNextVersion()` - 21 edges
9. `getProject()` - 19 edges
10. `compilerOptions` - 16 edges

## Surprising Connections (you probably didn't know these)
- `AppLayout()` --calls--> `listProjects()`  [INFERRED]
  app/(app)/layout.tsx → lib/actions/projects.ts
- `DeltaBadge()` --calls--> `cn()`  [EXTRACTED]
  components/analytics/analytics-cards.tsx → lib/utils.ts
- `buildExecutiveReportInput()` --calls--> `fmt()`  [INFERRED]
  lib/ai/prompts/executiveReport.ts → components/analytics/analytics-table.tsx
- `RoiBadge()` --calls--> `cn()`  [EXTRACTED]
  components/analytics/analytics-table.tsx → lib/utils.ts
- `RoiBadge()` --calls--> `cn()`  [EXTRACTED]
  components/dashboard/top-channels.tsx → lib/utils.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **NextAuth v5 Edge/Node split: auth.config.ts (Edge) + auth.ts (Node) governed by nextauth_v5** — nextauth_v5, auth_config_ts, auth_ts [EXTRACTED 1.00]
- **AI generation flow: anthropic_sdk → lib_ai → prisma_model_aiartifact (explicit user trigger, versioned, zod-validated)** — anthropic_sdk, lib_ai, prisma_model_aiartifact [EXTRACTED 1.00]
- **Database stack: prisma_neon + lib_db + manual_db_migration — Neon Postgres with manual SQL migration policy** — prisma_neon, lib_db, manual_db_migration [EXTRACTED 1.00]

## Communities (35 total, 7 thin omitted)

### Community 0 - "AI Server Actions"
Cohesion: 0.09
Nodes (54): ActionResult, ownedProject(), reportInputSchema, runAudienceSegments(), runBuyerPersona(), runCjm(), runCompanyAnalysis(), runCompetitorAnalysis() (+46 more)

### Community 1 - "App Layout & Navigation"
Cohesion: 0.14
Nodes (13): ProjectSwitcher(), ProjectSwitcherProps, DropdownMenu(), DropdownMenuCheckboxItem(), DropdownMenuContent(), DropdownMenuItem(), DropdownMenuLabel(), DropdownMenuRadioItem() (+5 more)

### Community 2 - "Auth & Project Actions"
Cohesion: 0.08
Nodes (15): ActionResult, registerUser(), ActionResult, createMetric(), ownedProject(), { handlers, auth, signIn, signOut }, FormErrors, LoginInput (+7 more)

### Community 3 - "Page Components & Routing"
Cohesion: 0.09
Nodes (37): getActiveProjectId(), ActionResult, createProject(), getProject(), ProjectListItem, updateProject(), AnalyticsPage(), AudiencePage() (+29 more)

### Community 4 - "Dependencies & Package Config"
Cohesion: 0.09
Nodes (23): dependencies, @anthropic-ai/sdk, @base-ui/react, bcryptjs, class-variance-authority, clsx, jspdf, lucide-react (+15 more)

### Community 5 - "Project Architecture Docs"
Cohesion: 0.18
Nodes (16): AI Marketing OS, Anthropic SDK (lib/ai/client.ts), App Router layout — (auth)/ and (app)/, Code principles (TypeScript strict, Zod, Server Components, no business logic in components), Design system tokens (globals.css @theme), graphify knowledge graph (graphify-out/), Iteration plan (0–6): Foundation → Company → Audience → CJM → Analytics → Director → SaaS, lib/actions/ — Server Actions (all mutations) (+8 more)

### Community 6 - "Strategy & Utils"
Cohesion: 0.09
Nodes (23): ActionResult, toggleStrategyTask(), horizonSchema, horizonValues, kpiSchema, roadmapItemSchema, Strategy, strategySchema (+15 more)

### Community 7 - "Company Intelligence UI"
Cohesion: 0.06
Nodes (53): runDirectorAnalysis(), listMetrics(), AnalyticsCards(), AnalyticsCardsProps, CardDef, CARDS, DeltaBadge(), AnalyticsChart() (+45 more)

### Community 8 - "Content Factory UI"
Cohesion: 0.10
Nodes (19): CalendarItem, categoryBorder, categoryLabel, ContentCalendar(), ContentCalendarProps, DAY_NAMES, typeConfig, Week (+11 more)

### Community 9 - "Audience Module UI"
Cohesion: 0.07
Nodes (37): AudienceView(), AudienceViewProps, LoadingKey, Job, JtbdCard(), JtbdCardProps, Persona, PersonaCard() (+29 more)

### Community 10 - "Component Aliases & Config"
Cohesion: 0.09
Nodes (21): aliases, components, hooks, lib, ui, utils, iconLibrary, menuAccent (+13 more)

### Community 11 - "TypeScript Config"
Cohesion: 0.10
Nodes (19): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+11 more)

### Community 12 - "Root Layout & Providers"
Cohesion: 0.28
Nodes (5): geistMono, geistSans, metadata, Providers(), Toaster()

### Community 13 - "Public SVG Assets"
Cohesion: 0.60
Nodes (5): File Icon SVG, Globe Icon SVG, Next.js Logo SVG, Vercel Logo SVG, Window/Browser Icon SVG

### Community 21 - "Community 21"
Cohesion: 0.10
Nodes (19): devDependencies, eslint, eslint-config-next, tailwindcss, @tailwindcss/postcss, @types/bcryptjs, @types/node, @types/react (+11 more)

### Community 22 - "Community 22"
Cohesion: 0.14
Nodes (14): AI Marketing OS — CLAUDE.md, AI-слой (ключевые принципы), graphify, Архитектура (где что живёт), База данных (текущая схема), Дизайн-система (токены в `app/globals.css`), Как обновлять этот файл, Переменные окружения (`.env` + Vercel) (+6 more)

### Community 23 - "Community 23"
Cohesion: 0.28
Nodes (9): auth.config.ts (Edge-compatible, no Prisma/bcrypt), auth.ts (Node.js, Prisma + bcrypt), Environment variables (DATABASE_URL, AUTH_SECRET, ANTHROPIC_API_KEY, BLOB_READ_WRITE_TOKEN, STRIPE_*), lib/db/ — Prisma client singleton, Manual DB migration via Neon SQL Editor (no prisma migrate deploy in build), NextAuth v5 — Edge/Node split, @vercel/blob, Prisma + Neon (Postgres) (+1 more)

### Community 24 - "Community 24"
Cohesion: 0.29
Nodes (6): This is NOT the Next.js you know, Next.js 16 (App Router, Turbopack), Next.js agent rule: read node_modules/next/dist/docs/ before writing code, Deploy on Vercel, Getting Started, Learn More

### Community 25 - "Community 25"
Cohesion: 0.33
Nodes (7): AI layer principles (explicit trigger, versioning, inputHash cache, zod validation), Enum: ArtifactType (15 values), Enum: ProjectStatus (DRAFT|ACTIVE|PAUSED|ARCHIVED), Prisma model: AiArtifact, Prisma model: Project, Prisma model: StrategyTask, Prisma model: User

### Community 26 - "Community 26"
Cohesion: 0.67
Nodes (3): active-project cookie + Zustand for active project state, zustand, Zustand (state management)

### Community 27 - "Community 27"
Cohesion: 0.20
Nodes (17): cn(), Card(), CardAction(), CardContent(), CardDescription(), CardFooter(), CardHeader(), CardTitle() (+9 more)

### Community 28 - "Community 28"
Cohesion: 0.18
Nodes (11): setActiveProject(), FormErrors, NewProjectDialog(), NewProjectDialogProps, ProjectCard(), ProjectCardItem, statusColor, statusLabel (+3 more)

### Community 29 - "Community 29"
Cohesion: 0.19
Nodes (9): uploadReportPdf(), ArtifactType, getDefaultRange(), ReportEntry, ReportsView(), ReportsViewProps, ReportTab, TABS (+1 more)

### Community 30 - "Community 30"
Cohesion: 0.24
Nodes (9): listProjects(), AppLayout(), AppHeader(), AppHeaderProps, AppSidebar(), AppSidebarProps, ProjectListItem, NavItem (+1 more)

### Community 31 - "Community 31"
Cohesion: 0.27
Nodes (7): CHANNELS, MetricFormDialogProps, FormErrors, Button(), buttonVariants, Input(), Label()

### Community 32 - "Community 32"
Cohesion: 0.22
Nodes (8): CompanyCardDialogProps, Dialog(), DialogContent(), DialogDescription(), DialogFooter(), DialogHeader(), DialogOverlay(), DialogTitle()

### Community 33 - "Community 33"
Cohesion: 0.22
Nodes (9): churnConfig, emotionConfig, JourneyStageCard(), JourneyStageCardProps, Stage, JourneyView(), JourneyViewProps, Cjm (+1 more)

## Knowledge Gaps
- **188 isolated node(s):** `FormErrors`, `FormErrors`, `geistSans`, `geistMono`, `metadata` (+183 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **7 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `Community 27` to `Community 32`, `App Layout & Navigation`, `Community 33`, `Page Components & Routing`, `Strategy & Utils`, `Company Intelligence UI`, `Content Factory UI`, `Audience Module UI`, `Community 28`, `Community 29`, `Community 30`, `Community 31`?**
  _High betweenness centrality (0.157) - this node is a cross-community bridge._
- **Why does `Recharts (monochrome charts)` connect `Project Architecture Docs` to `Company Intelligence UI`?**
  _High betweenness centrality (0.127) - this node is a cross-community bridge._
- **Why does `dependencies` connect `Dependencies & Package Config` to `Project Architecture Docs`, `Community 26`, `Community 21`, `Community 23`?**
  _High betweenness centrality (0.113) - this node is a cross-community bridge._
- **What connects `FormErrors`, `FormErrors`, `geistSans` to the rest of the system?**
  _189 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `AI Server Actions` be split into smaller, more focused modules?**
  _Cohesion score 0.08626434653831914 - nodes in this community are weakly interconnected._
- **Should `App Layout & Navigation` be split into smaller, more focused modules?**
  _Cohesion score 0.14035087719298245 - nodes in this community are weakly interconnected._
- **Should `Auth & Project Actions` be split into smaller, more focused modules?**
  _Cohesion score 0.08387096774193549 - nodes in this community are weakly interconnected._