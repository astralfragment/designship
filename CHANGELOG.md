# Changelog

## v0.1.0 — Initial Release (2026-04-13)

### Features
- **GitHub OAuth** — Sign in with GitHub, repos auto-connected
- **Timeline view** — Merged PRs displayed as a clean chronological feed
- **AI rewriting** — Claude rewrites technical PR descriptions into plain English
- **Builder / Stakeholder toggle** — Switch between technical and plain English views
- **Weekly summary generator** — One-click formatted stakeholder update from the week's activity
- **Summary history** — Past summaries stored in Supabase, exportable as Markdown
- **Figma integration** — OAuth connect, design screenshots embedded in timeline entries
- **Dark/light theme** — System preference detection + manual toggle
- **Responsive design** — Desktop-first, mobile-friendly
- **Copy/share** — Export summaries as formatted text for Slack/Teams

### Tech Stack
- TanStack Start + React 19 + TypeScript
- Tailwind CSS v4 + shadcn/ui + Studio Pro
- Supabase (Auth + Postgres)
- Claude API (sonnet-4)
- Vercel deployment
