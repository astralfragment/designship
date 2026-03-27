# DesignShip — PRD Overview

**Product:** DesignShip v2 — Personal Work OS  
**Vision:** Almost-zero-input tool that watches GitHub + Figma, builds your work record automatically, and generates reports, docs, and case studies on demand.  
**Stack:** Vite + React + TypeScript + TanStack Router + TanStack Query + shadcn/ui + Tailwind v4 + Supabase + Vercel AI SDK + Gemini 2.0 Flash  
**Repo:** https://github.com/astralfragment/designship  
**Agent rule:** Claude Code ONLY for frontend. Never GPT for UI.

## PRDs
- [01-foundation](./01-foundation.md) — Supabase schema, env setup, Figma OAuth, background sync
- [02-today-view](./02-today-view.md) — Today view, todos, pulse compare
- [03-timeline](./03-timeline.md) — Unified timeline, artifact cards, pairing, heatmap
- [04-outputs](./04-outputs.md) — AI generation, 7 output types, streaming UI, share links
- [05-feedback](./05-feedback.md) — Public feedback layer, reactions, comments
- [06-insights](./06-insights.md) — Velocity charts, personal baseline, insights dashboard
- [07-settings](./07-settings.md) — OAuth management, API key config, preferences

## Build Order
Run each PRD in sequence. Each phase must pass `npm run build` with zero errors and be committed before the next phase starts.
