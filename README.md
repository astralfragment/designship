# DesignShip

> Design it. Ship it. The tool that connects the two.

Zero-input communication layer that sits on top of your dev tools. DesignShip watches your GitHub and Figma activity, then auto-generates standups, release notes, stakeholder updates, and visual changelogs -- so you never have to write them yourself.

## Features

- **Timeline view** -- Your recent merged PRs, commits, and design changes in one feed
- **Builder / Stakeholder toggle** -- Technical details for devs, plain English for everyone else
- **AI-powered rewrites** -- Claude converts commit messages and PR descriptions into stakeholder-friendly language
- **Weekly summaries** -- One-click generation of "What shipped / In progress / Key decisions" reports, ready to paste into Slack or Teams
- **Figma integration** -- Design screenshots appear inline when PRs reference Figma links
- **Dark/light mode** -- Dark by default, with system preference detection

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | TanStack Start |
| Routing | TanStack Router (file-based) |
| Styling | Tailwind CSS v4 |
| Components | shadcn/ui + Studio Pro |
| Database | Supabase (Postgres + Auth + Realtime) |
| AI | Claude API (Anthropic) |
| Integrations | GitHub REST API, Figma REST API |
| Deployment | Vercel |

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
| `VITE_FIGMA_CLIENT_ID` | No | Figma OAuth app client ID |
| `FIGMA_CLIENT_SECRET` | No | Figma OAuth app client secret (server-only) |

4. Set up Supabase Auth with GitHub as an OAuth provider, and add your app's callback URL (`http://localhost:3000/auth/callback`) to the allowed redirect URLs.

5. Create the `summaries` table in your Supabase database:

```sql
create table summaries (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  date_from text not null,
  date_to text not null,
  shipped text[] default '{}',
  in_progress text[] default '{}',
  key_decisions text[] default '{}',
  repo_name text,
  generated_at timestamptz not null,
  created_at timestamptz default now()
);

alter table summaries enable row level security;

create policy "Users can manage their own summaries"
  on summaries for all
  using (auth.uid() = user_id);
```

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
