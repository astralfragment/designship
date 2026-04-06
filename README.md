<div align="center">

# DesignShip

**Design it. Ship it. The tool that connects the two.**

Zero-input communication layer that turns your GitHub + Figma activity into standups, release notes, and stakeholder updates.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Framework: TanStack Start](https://img.shields.io/badge/Framework-TanStack%20Start-ff4154)](https://tanstack.com/start)
[![Status: Alpha](https://img.shields.io/badge/Status-Alpha-orange)]()

![DesignShip Timeline](public/screenshot-timeline.png)

</div>

## Features

### Core

- Authenticate via GitHub OAuth and browse connected repositories
- View merged PRs in a chronological timeline with metadata badges
- Select any repo to filter the timeline feed
- Toggle between Builder and Stakeholder views per audience
- Generate weekly summaries and browse or export from history

### Integrations

- Connect Figma via OAuth from the settings page
- Display Figma design screenshots inline when PRs reference links
- Fetch repositories, PRs, and commits via GitHub REST API

### AI-powered

- Rewrite technical PR descriptions into plain English with Claude
- Generate structured weekly reports: Shipped, In Progress, Decisions
- Classify timeline events by feature area automatically

### Polish

- Switch dark and light themes with system preference detection
- Adapt layout responsively across mobile, tablet, and desktop
- Show skeleton loaders, error boundaries, and toast notifications
- Detect offline status and display a network indicator

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Framework | TanStack Start | Client-side focused React framework |
| Build Tool | Vinxi (v0.5+) | Server framework used by TanStack Start |
| Runtime | React 19 | UI library |
| Language | TypeScript | Type-safe JavaScript |
| Routing | TanStack Router | File-based routing with type safety |
| Styling | Tailwind CSS v4 | Utility-first CSS (CSS-native config via @tailwindcss/vite) |
| Components | shadcn/ui + Studio Pro | Premium component library |
| Database | Supabase | Postgres + Auth + Realtime |
| AI | Claude API (sonnet-4) | Summarisation, technical → plain English |
| Integrations | GitHub REST API | OAuth + PR/commit data |
| Integrations | Figma REST API | Design screenshots |
| Deployment | Vercel | TanStack Start Vercel preset |
| Auth | Supabase Auth | GitHub OAuth (connects repos too) |

Server-only secrets (`ANTHROPIC_API_KEY`, `FIGMA_CLIENT_SECRET`) are accessed via TanStack server functions and never exposed to the client bundle.

## Quick Start

**Prerequisites:** Node.js 20+, npm or pnpm, a [Supabase](https://supabase.com) project, a [GitHub OAuth App](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/creating-an-oauth-app) configured in Supabase Auth, an [Anthropic API key](https://console.anthropic.com), and optionally a [Figma OAuth App](https://www.figma.com/developers/apps).

```bash
git clone <repo-url>
cd designship
cp .env.example .env   # fill in your Supabase, Anthropic, and (optional) Figma credentials
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to start.

> The live deployment URL will be added once Vercel deployment is complete.

## Environment Variables

Copy `.env.example` to `.env` and fill in the values. The table below describes each variable.

| Variable | Required | Scope | Description |
|----------|----------|-------|-------------|
| `VITE_SUPABASE_URL` | Yes | Client | Supabase project URL (`https://<ref>.supabase.co`) |
| `VITE_SUPABASE_ANON_KEY` | Yes | Client | Supabase anonymous (public) API key |
| `ANTHROPIC_API_KEY` | Yes | Server | Anthropic API key for Claude-powered AI features |
| `VITE_FIGMA_CLIENT_ID` | No | Client | Figma OAuth app client ID (enables Figma integration UI) |
| `FIGMA_CLIENT_ID` | No | Server | Figma OAuth app client ID (used in server-side token exchange) |
| `FIGMA_CLIENT_SECRET` | No | Server | Figma OAuth app secret (used in server-side token exchange) |
| `SITE_URL` | No | Server | Base URL for OAuth redirect URIs (defaults to `http://localhost:3000`) |
| `EMAIL` | No | Build | shadcn Studio Pro license email |
| `LICENSE_KEY` | No | Build | shadcn Studio Pro license key |

> **Security:** Server-only variables must **not** be prefixed with `VITE_`. The `VITE_` prefix tells Vite to bundle the value into the client JavaScript, which would expose secrets to the browser. Only `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, and `VITE_FIGMA_CLIENT_ID` are safe to expose — they are public by design.

## Deployment

The project is configured for Vercel deployment with the TanStack Start preset.

1. Push your code to a Git repository
2. Import the project in the [Vercel dashboard](https://vercel.com/new)
3. Add all environment variables from `.env.example` in Project Settings > Environment Variables
4. Deploy

Notes:
- `VITE_*` variables are exposed to the client bundle
- `ANTHROPIC_API_KEY` and `FIGMA_CLIENT_SECRET` are server-only and must NOT be prefixed with `VITE_`
- Update OAuth callback URLs in Supabase and Figma to point to your production domain

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | TypeScript type check |

## License

Private
