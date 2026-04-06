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

## Prerequisites

- Node.js 20+
- A [Supabase](https://supabase.com) project
- A [GitHub OAuth app](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/creating-an-oauth-app) configured in your Supabase Auth settings
- An [Anthropic API key](https://console.anthropic.com) for AI features
- (Optional) A [Figma OAuth app](https://www.figma.com/developers/apps) for design integration

## Setup

1. Clone the repo and install dependencies:

```bash
git clone <repo-url>
cd designship
npm install
```

2. Copy the example env file and fill in your values:

```bash
cp .env.example .env
```

3. Configure the required environment variables in `.env`:

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_SUPABASE_URL` | Yes | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Yes | Your Supabase anonymous/public key |
| `ANTHROPIC_API_KEY` | Yes | Claude API key for AI summaries and rewrites |
| `VITE_FIGMA_CLIENT_ID` | No | Figma OAuth app client ID (shown in browser) |
| `FIGMA_CLIENT_ID` | No | Figma OAuth app client ID (server-only, for token exchange) |
| `FIGMA_CLIENT_SECRET` | No | Figma OAuth app client secret (server-only) |
| `SITE_URL` | No | Base URL for OAuth redirects (defaults to `http://localhost:3000`) |
| `EMAIL` | No | shadcn Studio Pro license email (for installing studio components) |
| `LICENSE_KEY` | No | shadcn Studio Pro license key |

4. Set up Supabase Auth with GitHub as an OAuth provider, and add your app's callback URL (`http://localhost:3000/auth/callback`) to the allowed redirect URLs. If using the Figma integration, also register `http://localhost:3000/auth/figma-callback` as the callback URL in your Figma Developer App settings.

5. Create the `summaries` table in your Supabase database by running the migration file:

```bash
# Copy the contents of supabase/migrations/20260404_create_summaries.sql
# into the Supabase SQL Editor and execute it
```

The migration creates the table with JSONB columns, RLS policies (SELECT, INSERT, DELETE), and an index on `user_id`.

6. Start the dev server:

```bash
npm run dev
```

The app will be available at `http://localhost:3000`.

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
