# customer-journey-map

# Customer Journey Map Skill

Build a complete, visually rich Customer Journey Map for any business — from a quick description or a detailed brief.

---

## Workflow

### Step 1 — Gather context

Before building, extract the following. If any are missing, ask the user:

- **Business type** — what does the company sell / do?
- **Target persona** — who is the typical client? (if unknown, define the most common one)
- **Goal of the map** — find leaks in the funnel? build content strategy? improve sales scripts?
- **Output format** — HTML artifact, text analysis, Figma, or Miro?
- **Known pain points** — anything the user already knows about where clients struggle?

If the user is describing a regional SMB (construction, roofing, dental, manufacturing, agriculture), apply the **Regional SMB Template** (see below).

---

### Step 2 — Define the Journey Stages

Use 5–7 stages appropriate for the business type. Default universal stages:

| # | Stage | Russian |
|---|-------|---------|
| 1 | Awareness | Осведомлённость |
| 2 | Consideration | Рассмотрение |
| 3 | Decision | Решение |
| 4 | Purchase / First contact | Покупка / Первый контакт |
| 5 | Delivery / Service | Исполнение |
| 6 | Post-purchase | Послепродажный опыт |
| 7 | Loyalty / Advocacy | Лояльность |

Adapt stages to the business (e.g., for roofing: add "Site Inspection" between Decision and Purchase).

---

### Step 3 — Fill each stage with:

For each stage, populate:

1. **Touchpoints** — specific channels where client meets the brand (Yandex search, Instagram, call, site, WhatsApp, manager visit, invoice, etc.)
2. **Client actions** — what the client physically does
3. **Client thoughts** — internal questions and doubts ("Кто эти люди?", "А вдруг сделают плохо?")
4. **Emotions** — score 1–5 or label: frustration / neutral / relief / trust / delight
5. **Pain points / Barriers** — what causes drop-off or hesitation
6. **Opportunities** — what the business could do better at this stage

---

### Step 4 — Output

Choose output based on user request:

#### A) HTML Artifact (default if no tool specified)

Build an interactive HTML table using `show_widget`. Design rules:
- Dark background (#0f1117) with colored stage headers
- Emotion shown as emoji row (😤 😐 🤔 😊 🤩) + colored bar
- Pain points highlighted in amber/red
- Opportunities highlighted in green
- Mobile-friendly, horizontally scrollable
- Include a summary section: top 3 pains + top 3 opportunities

Use CSS variables, clean typography (system-ui or Inter), and make it look like a real consulting deliverable.

#### B) Text analysis

Output a structured markdown report:
- Persona card
- Stage-by-stage table
- Critical moments (moments of truth)
- Priority recommendations ranked by impact

#### C) Figma

Load `/mnt/skills/plugins/figma:figma-use/SKILL.md` first.
Create a FigJam board with:
- Swimlane layout (one row per CJM dimension)
- Color-coded sticky notes per stage
- Emotion curve as a connected line
- Pain points as red stickies, opportunities as green

#### D) Miro

Use Miro MCP tools. Create a board with:
- Table layout using `Miro:table_create`
- Diagram for emotion curve using `Miro:diagram_create`
- Color-coded stickies or doc blocks for each cell

---

## Regional SMB Template

For businesses in Dagestan / North Caucasus / regional Russian markets, apply these additional layers:

**Trust dynamics**: The client decision cycle is longer and more relationship-based. Add a "Trust building" sub-layer to the Consideration and Decision stages. Key touchpoints: word-of-mouth, WhatsApp messages, real photos (not stock), local reviews, visible company address.

**Typical pain points by vertical:**

*Roofing / Construction:*
- Awareness: client doesn't know how to compare contractors
- Consideration: fears being overcharged or ghosted after deposit
- Decision: no clear pricing, no visual portfolio
- Post-purchase: zero communication during project
- Loyalty: no one asks for a review or referral

*Dental / Medical:*
- Awareness: fear of pain overrides interest
- Consideration: price anxiety, no transparent cost breakdown
- Decision: needs social proof (before/after photos, real reviews)
- Post-purchase: no follow-up from clinic

*Manufacturing / B2B (sandwich panels, trellis, etc.):*
- Awareness: found via Yandex, unsure if company is real
- Consideration: needs technical specs and volume pricing
- Decision: wants a phone call with a real person, not a form
- Post-purchase: delivery timing uncertainty

---

## Output Quality Checklist

Before delivering the CJM, verify:
- [ ] At least 5 stages defined
- [ ] Every stage has: touchpoints, client thought, emotion score, at least 1 pain
- [ ] At least one "moment of truth" identified (highest-impact decision point)
- [ ] At least 3 actionable opportunities listed
- [ ] If HTML: emotion row is visually present and color-coded
- [ ] Persona is named and described (not "client" — give them a name and a brief)

---

## Example Persona Card

```
Имя: Рустам, 38 лет
Бизнес: владелец частного дома в Каспийске
Задача: перекрыть крышу перед зимой
Страхи: низкое качество, недобросовестный подрядчик, непрозрачная цена
Каналы: Яндекс, Instagram, сарафанное радио
Решение принимает: сам, советуется с женой
```

---

## Notes for the AI

- If the user provides a real client case (e.g., "roofing company I worked with"), use real details — don't invent generic placeholder content.
- Prefer Russian language for all client-facing content (thoughts, touchpoints, pain points) unless user specifies otherwise.
- The map should feel like a real consulting artifact, not a textbook diagram.
- If building HTML, invest in the visual — this is something the user may show to their client.
