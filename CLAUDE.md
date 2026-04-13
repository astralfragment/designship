# CLAUDE.md — DesignShip

## Project Overview

**DesignShip** — Zero-input communication layer. Watches Figma + Git activity and auto-generates standups, release notes, stakeholder updates, and visual changelogs.

- **Stack:** Electron 33 + React 19 + TanStack Router/Query + Zustand + SQLite + Vercel AI SDK + Tailwind CSS 4
- **Project dir:** `C:\Users\char\Desktop\designship`
- **Runtime:** Desktop app (Electron), tray-resident

## Core Principle

Zero input, maximum output. You change nothing about how you work. You update Figma, commit code, merge PRs, deploy — and DesignShip turns that activity into every communication artifact your team and stakeholders need. If the user has to manually enter data, the product has failed.

## Design Direction

- Pastel-dark aesthetic. Soft glows on dark surfaces. Not a dashboard — **a timeline.**
- Figma purple (`#a259ff`), Git green (`#58d68d`), AI pink (`#f8a5c2`)
- Fonts: Space Grotesk (headings), IBM Plex Sans (body), JetBrains Mono (code)
- Dark mode only (MVP)
- Two views: Builder (technical) and Stakeholder (plain English)

## Architecture

```
electron/          — Main process (Node.js)
  main.ts          — App entry, window management
  preload.ts       — Context bridge (IPC)
  tray.ts          — System tray
  watchers/        — Figma polling + Git filesystem watching
  ai/              — Template summaries + AI provider (Ollama/Claude)
  db/              — SQLite schema, event/summary CRUD
  ipc/             — IPC handlers

src/               — Renderer process (React)
  routes/          — TanStack Router pages (timeline, settings, summaries)
  hooks/           — TanStack Query hooks for IPC data
  stores/          — Zustand (UI state, filters)
  styles/          — Tailwind CSS + design tokens

shared/            — Types shared between main + renderer
  ipc-types.ts     — IPC channel contract
```

## Key Patterns

- **IPC bridge:** All main↔renderer communication via typed `ipcMain.handle` / `ipcRenderer.invoke`. API exposed as `window.ds.*` via contextBridge.
- **SQLite:** 5 tables (events, event_links, projects, summaries, snapshots). WAL mode. ULID primary keys.
- **Figma watcher:** Polls REST API on interval. Detects changes via `lastModified`. Captures PNG snapshots.
- **Git watcher:** `chokidar` on `.git/refs/heads`. Parses commits via `simple-git`. Extracts Figma URLs from messages.
- **Summaries:** Template-based (zero cost) by default. AI opt-in via Ollama (local) or Claude API.
- **AI SDK:** Vercel AI SDK (`ai` package) with `@ai-sdk/anthropic` and `ollama-ai-provider`.

## Commands

```bash
npm run dev        # Start Electron with hot reload
npm run build      # Build for production
npm run package    # Package Windows installer
npm run typecheck  # TypeScript check
```

## Important Conventions

- Dark mode only (MVP)
- Timeline is the core UI — everything feeds into it
- Template summaries work without AI — AI is an optional quality enhancement
- Figma PAT stored in app config (SQLite), not plaintext
- No cloud dependency for core function — everything local
- CSS tokens use Tailwind v4 @theme inline with custom properties
