# DesignShip v2 — Spec
**Date:** 2026-03-27  
**Status:** Approved for build  
**Base:** v1 already built (Vite + TanStack Router + shadcn, GitHub OAuth + PR timeline + weekly summary deployed to Vercel)

---

## What It Is

A **personal work OS** for designers who ship code (or work alongside engineers). Almost zero manual input — it watches GitHub and Figma automatically, builds a living record of your work, and generates whatever output you need (updates, docs, case studies, handoffs) on demand.

The killer feature: **GitHub PR + Figma design as one paired artifact** — "I designed this, I built this" in a single card.

---

## The 5 Pillars

### 1. Today View (`/today`)
- Auto-populated: PRs merged + Figma frames modified today
- Optional todo list: manually add items, or auto-surface from open PRs (GitHub issues/PRs with "in progress" state)
- **Pulse compare** (all three):
  - vs yesterday
  - vs same day last week
  - vs your personal rolling average
- Designed to open every morning, close every evening

### 2. Timeline (`/timeline`)
- Unified feed: GitHub PR + paired Figma frame as one artifact card
- Filter/group by: day / project / type (Shipped ✨ / Fixed 🐛 / Designed 🎨 / Cleaned Up 🧹)
- Date range picker: Today / This Week / This Month / Custom
- Heatmap activity overview (GitHub contributions-style, but for all work)
- Historical — scroll back to any week/month in your stored history

### 3. Outputs (`/outputs`)
One-click generation for each, powered by Vercel AI SDK + Gemini 2.0 Flash (free). All regeneratable.

| Output | What it contains | Primary audience |
|---|---|---|
| Weekly stakeholder update | PRs + designs this week, 3 tones (Builder / Stakeholder / Achievement) | PM, client, manager |
| Status update | Short async-comms blurb, what's done + what's next | Slack, standup |
| Case study | Design decision + what shipped + outcome narrative | Hiring manager, portfolio |
| Design doc | Figma annotations + component specs + design rationale | Engineers, future-you |
| Handoff doc | Design + code + context in one doc | New dev, client, Confluence |
| User docs | Feature-level explanation from PR descriptions + Figma | End users |
| System docs | Technical overview from PR diffs + architecture | DevOps, new engineers |

### 4. Feedback (`/feedback/:shareId`)
- Share any output (design, report, case study) via a public link — no login required to view
- Viewer can leave: structured comments, emoji reactions, approval/rejection
- Design stage: comment on specific Figma frames (by frame name reference)
- Post-ship: reactions + notes on case studies/reports
- Notifications back to owner when feedback arrives

### 5. Insights (`/insights`)
- Work velocity over time (PRs per week, designs per week)
- Most active projects
- Output type breakdown (how much shipping vs designing vs fixing)
- Personal baseline computation — what's your normal week look like
- Simple charts, not analytics overkill

---

## Data Architecture

### Storage
**Supabase** (free tier, Postgres + realtime):
- `users` — GitHub/Figma OAuth tokens, preferences
- `github_prs` — cached PR data (title, description, merged_at, repo, branch, diff_summary)
- `figma_frames` — cached frame data (file_id, frame_id, name, last_modified, thumbnail_url, annotations)
- `artifacts` — paired work items (pr_id + figma_frame_id + confidence score + manual_override)
- `todos` — user's manual todo items
- `outputs` — generated docs/reports (type, content, share_id, created_at)
- `feedback` — feedback on shared outputs

### Data Ingestion
- On login: full sync of last 30 days GitHub + Figma
- Background: polling every 15 min via Vercel cron job (`/api/sync`)
- On demand: manual "refresh" button

### Auto-pairing Algorithm
Match GitHub PRs to Figma frames:
1. **Time proximity** — merged_at within ±3 days of figma last_modified → candidate
2. **Name matching** — fuzzy match PR title vs frame name (e.g. "checkout redesign" ↔ "Checkout / Desktop") → confidence score
3. **Branch hints** — `feat/checkout-ui` → extract keywords, match against frame names
4. Threshold: confidence > 0.6 → auto-pair, < 0.6 → show as suggestion for manual review

---

## AI Generation

### Stack
- **Vercel AI SDK** (`ai` package) — model-agnostic, one interface
- **Default model:** `google('gemini-2.0-flash')` via `@ai-sdk/google` — free tier (1,500 req/day from aistudio.google.com)
- **Optional upgrade:** `anthropic('claude-3-5-haiku-latest')` via `@ai-sdk/anthropic` — $0.25/MTok
- **Fallback:** deterministic template generation if no API key set — app always works

### Generation flow
```
user clicks "Generate [output type]"
  → /api/generate (POST)
  → assemble context: PR data + Figma frame names + annotations + user notes
  → call AI SDK with typed prompt template
  → stream response back to client
  → save to outputs table
  → return share_id
```

### Environment variables
```
GOOGLE_GENERATIVE_AI_API_KEY=   # free, from aistudio.google.com
ANTHROPIC_API_KEY=              # optional upgrade
```

---

## Integrations

### GitHub (already built in v1)
- OAuth App: read:user, repo scope
- Endpoints used: `/user/repos`, `/repos/{owner}/{repo}/pulls?state=closed&merged=true`

### Figma (new)
- OAuth App: `file_read` scope
- Endpoints: `/v1/me`, `/v1/files/{file_key}`, `/v1/files/{file_key}/comments`
- Frame thumbnails: `/v1/images/{file_key}?ids={node_ids}`
- Version history: `/v1/files/{file_key}/versions`

### Export
- **Notion:** Notion API integration — export any output as a Notion page
- **Markdown:** copy as raw Markdown (always available, no API needed)
- **HTML:** copy as HTML (for pasting into Confluence etc.)

---

## Visual Design

Continue the v1 aesthetic:
- Dark base, subtle grain/paper texture
- Palette: dusty rose `#c9a8a8`, slate `#8a9bb0`, off-white `#f5f2ee`, charcoal `#1a1a1f`
- Playfair Display for headings, DM Sans for UI, JetBrains Mono for code/hashes
- Sophisticated, textured, handcrafted — NOT corporate SaaS

New design elements for v2:
- **Artifact cards**: two-panel — left shows Figma thumbnail, right shows PR info. Paired indicator (chain link icon). Confidence badge if auto-matched.
- **Heatmap**: custom-styled contribution grid, dusty rose intensity scale
- **Today view**: asymmetric layout — left column is today's work, right is pulse/compare
- **Output panel**: slide-out drawer, rendered markdown, streaming text animation

---

## Routes

```
/                    → landing (already built)
/dashboard           → redirect to /today
/today               → Today view (NEW)
/timeline            → Unified timeline (UPGRADE from v1)
/outputs             → Output generation hub (NEW)
/outputs/:id         → View/edit a specific output
/feedback/:shareId   → Public feedback view (NEW, no auth)
/insights            → Insights/velocity charts (NEW)
/settings            → OAuth connections, API keys, preferences (NEW)
```

---

## File Structure (additions to v1)

```
src/
├── routes/
│   ├── today/index.tsx          NEW
│   ├── timeline/index.tsx       UPGRADE
│   ├── outputs/
│   │   ├── index.tsx            NEW
│   │   └── $id.tsx              NEW
│   ├── feedback/$shareId.tsx    NEW
│   ├── insights/index.tsx       NEW
│   └── settings/index.tsx       NEW
├── components/
│   ├── artifact-card.tsx        NEW - paired PR+Figma card
│   ├── heatmap.tsx              NEW
│   ├── pulse-compare.tsx        NEW
│   ├── output-panel.tsx         NEW - streaming doc generator
│   ├── feedback-view.tsx        NEW
│   └── ui/                      existing shadcn components
├── lib/
│   ├── github.ts                existing
│   ├── figma.ts                 NEW
│   ├── pairing.ts               NEW - auto-pairing algorithm
│   ├── generate.ts              NEW - AI SDK wrapper
│   ├── rewrite.ts               existing
│   └── utils.ts                 existing
api/
├── auth/
│   ├── login.ts                 existing
│   ├── callback.ts              existing
│   ├── figma-login.ts           NEW
│   └── figma-callback.ts        NEW
├── sync.ts                      NEW - background data sync (Vercel cron)
├── generate.ts                  NEW - AI generation endpoint
├── feedback.ts                  NEW - save feedback
└── github/
    └── prs.ts                   existing
```

---

## Environment Variables (full set)

```bash
# GitHub OAuth
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=

# Figma OAuth
FIGMA_CLIENT_ID=
FIGMA_CLIENT_SECRET=

# Session
SESSION_SECRET=

# Database
DATABASE_URL=          # Supabase Postgres connection string
SUPABASE_ANON_KEY=     # Supabase anon key

# AI (at least one recommended)
GOOGLE_GENERATIVE_AI_API_KEY=   # free from aistudio.google.com
ANTHROPIC_API_KEY=              # optional upgrade, claude haiku

# Notion (optional)
NOTION_CLIENT_ID=
NOTION_CLIENT_SECRET=

# App
VITE_APP_URL=          # production URL for OAuth callbacks
```

---

## Build Order (ralph loop)

1. **Supabase setup** — create project, run schema migrations, connect to app
2. **Background sync** — `/api/sync` cron, GitHub + Figma data ingestion, store in DB
3. **Figma OAuth** — auth flow, token storage, frame fetching
4. **Auto-pairing** — pairing algorithm, artifact table population
5. **Today view** — auto-populated, todos, pulse compare
6. **Timeline upgrade** — artifact cards with paired designs, heatmap
7. **AI generation** — Vercel AI SDK + Gemini, all 7 output types
8. **Output panel** — streaming UI, save + share
9. **Feedback layer** — public share links, feedback collection
10. **Insights** — velocity charts, personal baseline
11. **Settings** — OAuth management, API key config
12. **Notion export** — optional, last
13. **Deploy + smoke test**

---

## Done When
- [ ] Supabase connected, schema migrated
- [ ] GitHub + Figma data auto-syncing every 15 min
- [ ] Figma OAuth works
- [ ] Auto-pairing producing reasonable matches
- [ ] Today view live with pulse compare
- [ ] Timeline shows paired artifact cards
- [ ] All 7 output types generating (Gemini or deterministic fallback)
- [ ] Sharing + feedback working
- [ ] Insights charts rendering
- [ ] Deployed to Vercel, all env vars set
- [ ] `npm run build` passes with zero errors

---

## Notify when done
```bash
openclaw system event --text "Done: DesignShip v2 built — Figma + GitHub unified timeline, Today view, 7 output types with Gemini AI, feedback layer, insights. Deployed to Vercel." --mode now
```
