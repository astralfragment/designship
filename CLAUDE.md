# CLAUDE.md — Fragment

## Project Overview

**Fragment** — A product workspace by **Lilac Fragment** for turning scattered product context into build-ready specs. Capture notes, feedback, decisions, and requirements; auto-group by tag; draft markdown specs (template by default, AI-enhanced if configured).

- **Stack:** Electron 33 + React 19 + TanStack Router/Query + Zustand + SQLite + Vercel AI SDK + Tailwind CSS 4
- **Runtime:** Local-first desktop app (Electron), tray-resident
- **Status:** Early prototype, active development

## Core Principle

Clarity over capture. Fragment is a calm workspace, not a dashboard. The user pastes messy notes, feedback, and decisions in; Fragment shapes them into clear implementation direction. AI is an optional quality upgrade — the template path always works.

## Design Direction

- Soft Japandi-glass aesthetic on a light pastel base. Not a dashboard — **a workspace.**
- Ink (`#24172F`) text on Cream (`#FFFAF5`) background
- Lilac (`#C8B6FF`) brand accent, Iris (`#9F87FF`) interactive, Blush (`#FFD2E7`) warm, Sky (`#DCEEFF`) cool
- Fonts: Geist (sans, all UI), Instrument Serif (sparing editorial accent)
- Light/pastel only (MVP)

## Architecture

```
electron/          — Main process (Node.js)
  main.ts          — App entry, window management, sample seeding
  preload.ts       — Context bridge (IPC) — exposes window.fragment
  tray.ts          — System tray
  ai/              — Template + AI spec drafting (Ollama/Claude)
  db/              — SQLite schema, fragment/spec CRUD, sample workspace
  ipc/             — IPC handlers
  watchers/        — Parked: Figma + Git watchers (future integrations)

src/               — Renderer process (React)
  pages/           — Capture, Fragments, Specs, Settings
  hooks/           — TanStack Query hooks for IPC data
  stores/          — Zustand (current project, selected fragments)
  components/      — Shared UI (EmptyState, etc.)
  styles/          — Tailwind CSS + Fragment design tokens

shared/            — Types shared between main + renderer
  ipc-types.ts     — IPC channel contract

docs/              — Roadmap and product docs
```

## Key Patterns

- **IPC bridge:** All main↔renderer communication via typed `ipcMain.handle` / `ipcRenderer.invoke`. API exposed as `window.fragment.*` via contextBridge.
- **SQLite:** Fragment tables (fragments, context_groups, fragment_links, decisions, specs) plus `projects` and `app_config`. WAL mode. ULID primary keys.
- **Sample workspace:** On first launch, an idempotent seeder creates a "Welcome to Fragment" project with 8 demo fragments demonstrating the full workflow.
- **Spec drafting:** Template-based (zero cost) by default. AI opt-in via Ollama (local) or Claude API for higher-quality drafts.
- **AI SDK:** Vercel AI SDK (`ai` package) with `@ai-sdk/anthropic` and `ollama-ai-provider`.

## Commands

```bash
npm run dev        # Start Electron with hot reload
npm run build      # Build for production
npm run package    # Package Windows installer
npm run typecheck  # TypeScript check
```

## Important Conventions

- Light/pastel by default
- Capture → Fragments → Specs is the core UI flow
- Template specs work without AI — AI is an optional quality enhancement
- AI keys stored in app config (SQLite) or `.env`, never plaintext in repo
- No cloud dependency for core function — everything local
- CSS tokens use Tailwind v4 @theme inline with custom properties
- Figma/Git watcher code is parked under `electron/watchers/` for a future
  integration phase; not started by default
