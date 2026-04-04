# CLAUDE.md — DesignShip

## Project Overview

**DesignShip** — Zero-input communication layer that sits on top of existing dev tools (GitHub, Figma, Jira, Slack/Teams). Watches activity and auto-generates standups, release notes, stakeholder updates, and visual changelogs.

- **Stack:** TanStack Start (client-side focused) + Tailwind CSS + shadcn/ui + shadcn studio pro + Supabase (Postgres + Auth + Realtime) + Claude API + Vercel
- **Project dir:** `C:\Users\char\Desktop\designship`
- **Deployment:** Vercel

## Core Principle

Zero input, maximum output. The user changes nothing about how they work. They commit code, update Figma, merge PRs, deploy — and DesignShip turns that activity into every communication artifact their team and stakeholders need. If the user has to manually enter data, the product has failed.

## Design Direction

- Clean, minimal, calm. Not a dashboard. Not a control panel. **A timeline.**
- Think Linear meets Notion meets a personal journal
- **Dark mode first** (developers live in dark mode)
- Typography-forward. Let the content breathe.
- No configuration screens if possible. Smart defaults. Progressive disclosure.
- Mobile-friendly but desktop-first (this is a work tool)
- Font: Inter only
- Use `--ds-*` CSS custom property prefix for design tokens

## Repo Structure

```
designship/
├── CLAUDE.md                  ← this file
├── run-loop.sh                ← ralphex runner
├── queue-run-loop.sh          ← auto-retry on usage limits
├── .ralphex/
│   ├── config                 ← ralphex settings
│   └── progress/              ← task completion tracking
├── docs/plans/                ← ralphex plan files
├── .env                       ← shadcn studio license (gitignored)
├── components.json            ← shadcn/ui + studio config
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── app.config.ts              ← TanStack Start config
├── app/
│   ├── routes/                ← TanStack file-based routes
│   ├── components/            ← shared components
│   ├── lib/                   ← utilities, API clients
│   └── styles/                ← global CSS
├── src/
│   ├── components/
│   │   └── ui/                ← shadcn/ui components
│   ├── lib/
│   │   ├── supabase.ts        ← Supabase client
│   │   ├── github.ts          ← GitHub API client
│   │   ├── figma.ts           ← Figma API client
│   │   └── ai.ts              ← Claude API integration
│   └── hooks/                 ← custom React hooks
└── public/                    ← static assets
```

## Mandatory Skill Usage

**EVERY task in the build plan MUST use at least one skill.** The ralphex loop should invoke skills as follows:

### Design & UI Tasks
- `/iui` — Inspiration UI: browse shadcn studio blocks for design inspiration before building
- `/cui` — Create UI: install and customize shadcn studio blocks for page layouts
- `/rui` — Refine UI: refine individual components with studio variants
- `/shadcn` — shadcn/ui best practices and patterns
- `frontend-design` — Production-grade frontend interface design
- `ui-ux-design-pro` — Senior-level UI/UX design guidance
- `refactoring-ui` — Visual hierarchy, spacing, color, depth fixes
- `audit-ui` — Accessibility, interaction, forms, typography audit

### Architecture & Code Tasks
- `brainstorming` — Before any creative/feature work
- `writing-plans` — Before multi-step implementations
- `test-driven-development` — Before writing implementation code
- `systematic-debugging` — When encountering bugs
- `verification-before-completion` — Before claiming work is done

### Review Tasks
- `requesting-code-review` — After completing features
- `simplify` — Review changed code for reuse and quality

## shadcn Studio Pro Setup

shadcn commands:
- `npx shadcn@latest add {component}` — add base components
- `npx shadcn@latest add @ss-components/{name}` — studio component variants
- `npx shadcn@latest add @ss-blocks/{name}` — studio blocks
- `npx shadcn@latest add @ss-themes/{name}` — studio themes

License credentials in `.env` (gitignored):
```
EMAIL=designer@aie.ac
LICENSE_KEY=BB2FB7B1-8AFB-4A59-BD02-6C86AFF12B9C
```

## Tech Stack Details

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Framework | TanStack Start | Client-side focused React framework |
| Routing | TanStack Router | File-based routing with type safety |
| Styling | Tailwind CSS | Utility-first CSS |
| Components | shadcn/ui + Studio Pro | Premium component library |
| Database | Supabase | Postgres + Auth + Realtime |
| AI | Claude API | Summarisation, technical → plain English |
| Integrations | GitHub REST API | OAuth + PR/commit data |
| Integrations | Figma REST API | Design screenshots |
| Deployment | Vercel | Edge deployment |
| Auth | Supabase Auth | GitHub OAuth (connects repos too) |

## Important Conventions

- **Dark mode first** — always design for dark, then adapt for light
- **No configuration screens** — smart defaults, progressive disclosure
- **Timeline is the core UI** — everything radiates from the timeline
- **Two views only:** Builder (technical) and Stakeholder (plain English)
- **Zero input philosophy** — if the user has to enter data manually, it's a bug
- **Typography-forward** — Inter font, generous whitespace, clear hierarchy
- **CSS tokens:** use `--ds-*` prefix for all custom properties
- **No jQuery** — React only
- **TypeScript strict mode** — no `any` types

## Instructions for Using the shadcn/studio MCP SERVER

**Strict Adherence Required**: Every time you interact with the shadcn/studio MCP Server, **follow all instructions precisely**.

- Follow the workflow exactly as outlined by the MCP Server step by step.
- **Avoid Shortcuts**: Never attempt to bypass steps or rush through the process.

### MANDATORY BEHAVIOR FOR ALL WORKFLOWS:

- Follow each step immediately after completing the previous one
- Trust the workflow and proceed without hesitation
- Follow the specific tool sequence outlined in each workflow
- Complete the ENTIRE workflow without stopping for user confirmation
- Do NOT make explanations between steps
- Do NOT make additional tool calls not required by the workflow
- Do NOT jump around or skip steps
- Do NOT stop mid-workflow asking for user confirmation

### WORKFLOW-SPECIFIC RULES:

#### FOR CREATE-UI (/cui):
- **COLLECT FIRST, INSTALL LAST**: Complete ALL block collection before ANY installation
- **NO PREMATURE INSTALLATION**: Do not use installation tools until collection phase is complete
- **MANDATORY CONTENT CUSTOMIZATION**: After installation, automatically proceed to customize content

#### FOR REFINE-UI (/rui):
- Follow the refine workflow using component tools
- Update existing components according to user requirements

#### FOR INSPIRATION-UI (/iui):
- Follow the inspiration workflow for design ideas
- Use inspiration tools as outlined

## Revenue Model (Future Reference)

- Free: Personal use, 1 repo, manual summary generation
- Pro ($12/month): Unlimited repos, auto-posting, Figma integration, stakeholder view
- Team ($8/user/month): Team timeline, workload heatmap, blocker detection, auto-standups
