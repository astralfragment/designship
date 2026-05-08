<div align="center">

# Fragment

**From scattered context to build-ready specs.**

A product workspace by [Lilac Fragment](#about-lilac-fragment). Capture notes, feedback, decisions, and requirements — then shape them into clear implementation direction.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Status: Early Prototype](https://img.shields.io/badge/Status-Early%20Prototype-C8B6FF)]()
[![Built with Electron](https://img.shields.io/badge/Built%20with-Electron-9F87FF)](https://www.electronjs.org/)

</div>

## What it is

Fragment is a calm, local-first desktop workspace for the messy middle of product work. You paste notes, feedback, decisions, and questions in. Fragment groups them by tag, preserves their context, and turns selected fragments into a real markdown spec — Problem, Background, Requirements, Acceptance Criteria, Open Questions, Decision History.

The template path always works. AI is an optional quality upgrade, not a requirement.

## Who it's for

- Product managers
- Startup founders
- Product designers
- Software developers
- QA testers
- Technical product managers

## What problem it solves

Software teams lose context across chats, docs, tickets, calls, design files, and customer feedback. Decisions are forgotten, requirements are unclear, work is rebuilt from memory, and handoffs are weak.

Fragment is a clarity layer between discussion and delivery. It keeps product reasoning connected to the work, so what gets built is what was actually decided.

## Status

**Early prototype.** Local-first Electron desktop app, actively in development. The current build supports the full Capture → Group → Spec flow with template-based drafting (and optional AI). See [docs/roadmap.md](docs/roadmap.md) for what's planned.

## Quick start

**Prerequisites:** Node.js 20+, npm. (`better-sqlite3` and `sharp` are native modules — your platform needs working build tools. On macOS that means Xcode CLT; on Linux, `build-essential` + `python3`; on Windows, the windows-build-tools.)

```bash
git clone <repo-url>
cd fragment
cp .env.example .env       # optional — only needed for AI assist
npm install
npm run dev                # launches the Electron app with hot reload
```

On first launch, Fragment seeds a "Welcome to Fragment" workspace with sample fragments so you can try the workflow immediately — no setup required.

## Commands

| Command | Description |
|---|---|
| `npm run dev` | Start Electron with hot-reload |
| `npm run build` | Production build (main, preload, renderer) |
| `npm run typecheck` | TypeScript check, no emit |
| `npm run package` | Build a Windows installer (`.exe`) |
| `npm run package:mac` | Build a macOS DMG |
| `npm run package:linux` | Build a Linux AppImage |

## Environment

Fragment runs without any environment variables. Configure these only if you want AI-enhanced spec drafts.

| Variable | Required | Description |
|---|---|---|
| `ANTHROPIC_API_KEY` | No | Claude API key for AI spec drafting |
| `OLLAMA_BASE_URL` | No | Local Ollama endpoint (default `http://localhost:11434`) |
| `OLLAMA_MODEL` | No | Ollama model name (e.g. `llama3.2`) |

You can also set the AI provider in **Settings → AI assist** at runtime.

## Architecture

```
electron/          Main process (Node.js)
  main.ts          App entry, window, sample seeding
  preload.ts       Context bridge — exposes window.fragment
  tray.ts          System tray
  ai/              Template + AI spec drafting (Ollama / Claude)
  db/              SQLite schema + fragment/spec CRUD + sample workspace
  ipc/             IPC handlers
  watchers/        Parked: Figma + Git watchers (future integrations)

src/               Renderer process (React)
  pages/           Capture, Fragments, Specs, Settings
  hooks/           TanStack Query hooks for IPC data
  stores/          Zustand (current project, selected fragments)
  components/      Shared UI
  styles/          Tailwind CSS + Fragment design tokens

shared/            Types shared between main and renderer
docs/              Roadmap and product docs
```

**Tech:** Electron 33, React 19, TanStack Router/Query, Zustand, SQLite (`better-sqlite3`), Tailwind CSS 4, Vercel AI SDK (`ai` + `@ai-sdk/anthropic` + `ollama-ai-provider`).

## Roadmap

See [docs/roadmap.md](docs/roadmap.md). The short version:

1. **Foundation** — public repo, brand, docs, prototype *(in progress)*
2. **Capture and organise** — projects, fragments, tags, context groups, decisions
3. **Spec generation** — template + AI drafting, acceptance criteria, exports
4. **Integrations** — GitHub issues, Notion, Linear, Jira, Slack, Figma
5. **Collaboration** — team workspaces, comments, review status

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md). Contributions that improve clarity, reduce ambiguity, and keep the UI calm and usable are welcome.

## License

[MIT](LICENSE) © 2026 Charlize / Lilac Fragment.

## About Lilac Fragment

Lilac Fragment is an early-stage product-led software company building Fragment, an open-source product workspace for clearer software delivery. Fragment helps product, design, development, and QA teams move from messy context to clear implementation — by capturing notes, feedback, decisions, and requirements, then shaping them into structured specs.
