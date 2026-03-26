# DesignShip — Build Task

## What you're building
DesignShip: a GitHub PR timeline + stakeholder communication tool. Real GitHub data, genuinely useful.

## Stack (MUST use)
- **Vite + React + TypeScript** (NOT Next.js)
- **TanStack Router** (file-based routing)
- **TanStack Query** (data fetching/caching)
- **shadcn/ui** components (init with `npx shadcn@latest init`)
- **Tailwind v4**
- **Vercel** for deployment (API routes as Vercel serverless functions in `/api/`)

## Skills to follow for UI
Always follow these design principles:
1. **frontend-design skill**: distinctive, non-generic aesthetics
2. **shadcn-ui skill**: use shadcn blocks and components throughout

## Visual Design Direction
- Dark base with subtle grain/paper texture on backgrounds
- Muted palette: dusty rose (#c9a8a8), slate (#8a9bb0), off-white (#f5f2ee), deep charcoal (#1a1a1f)
- Display font: Playfair Display (serif) for headings
- Body/UI: DM Sans or similar clean sans
- Mono: JetBrains Mono for PR refs, code, hashes
- Personality: sophisticated, textured, handcrafted feel — NOT corporate, NOT a SaaS template
- Decorative: delicate 1px borders, soft glows on active states, subtle grain overlay on hero areas
- Reflects Char's personality: pastel-goth, kawaii-adjacent, detail-oriented

## Features (MVP — all must actually work)

### 1. GitHub OAuth
- OAuth flow via GitHub App or OAuth App
- Store token securely (server-side in Vercel function, not exposed to client)
- After auth: redirect to dashboard
- Show user avatar + name when logged in

### 2. PR Timeline
- Fetch merged PRs from user's repos (last 7/14/30 days — user can toggle)
- Show: repo name, PR title, merged date, author
- **Builder view** (default): technical — shows PR title, branch, commit count
- **Stakeholder view** (toggle): rewrites each PR in plain English — "Improved checkout flow speed", not "feat: refactor payment middleware"
  - Use deterministic rewriting rules first (strip feat:/fix:/chore: prefixes, title-case, expand abbreviations)
  - Optionally use Claude API if ANTHROPIC_API_KEY set

### 3. Weekly Summary
- Button: "Generate Weekly Summary"
- Takes last 7 days of PRs → formats as stakeholder-ready update
- Format: "This week I [shipped X, fixed Y, improved Z]. Key highlights: ..."
- Copy to clipboard button
- Works without AI (deterministic fallback) — AI makes it better if key is set

### 4. UI Layout
- Sidebar nav (shadcn Sidebar block)
- Dashboard home: timeline + summary panel side by side
- Clean, airy, NOT cramped
- Responsive (mobile works)

## File Structure
```
designship/
├── src/
│   ├── routes/          # TanStack Router file-based routes
│   │   ├── __root.tsx
│   │   ├── index.tsx    # Landing / login
│   │   └── dashboard/
│   │       ├── index.tsx
│   │       └── route.tsx
│   ├── components/
│   │   ├── ui/          # shadcn components
│   │   └── ...
│   ├── lib/
│   │   ├── github.ts    # GitHub API client
│   │   ├── rewrite.ts   # PR title rewriting logic
│   │   └── utils.ts
│   └── main.tsx
├── api/                 # Vercel serverless functions
│   ├── auth/
│   │   ├── login.ts     # Redirect to GitHub OAuth
│   │   └── callback.ts  # Handle OAuth callback, set cookie
│   └── github/
│       ├── prs.ts       # Fetch merged PRs
│       └── summary.ts   # Generate weekly summary
├── public/
├── index.html
├── vite.config.ts
├── vercel.json
├── .env.example
└── package.json
```

## Environment Variables
```
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
SESSION_SECRET=          # random 32+ char string for cookie signing
ANTHROPIC_API_KEY=       # optional
VITE_API_BASE=           # set to '' for local, vercel URL for prod
```

## Setup Steps (do these in order)
1. `npm create vite@latest . -- --template react-ts` (in designship/ dir)
2. Install deps: `npm install @tanstack/react-router @tanstack/react-query @tanstack/router-vite-plugin`
3. Init shadcn: `npx shadcn@latest init` (choose dark, zinc, CSS variables yes)
4. Install shadcn components needed: button, card, badge, avatar, separator, tabs, sheet, sidebar
5. Set up TanStack Router with file-based routing
6. Build all features
7. Set up vercel.json for API routes
8. Commit everything with good commit messages
9. Deploy to Vercel

## Vercel Deploy Command
```bash
TOKEN=$(cat /home/char/.openclaw/workspace/.vercel-token | grep VERCEL_TOKEN | cut -d= -f2)
npx vercel --prod --yes --token "$TOKEN"
```

## Git Remote
```bash
git remote add origin git@github.com:astralfragment/designship.git
```

## Ralph Loop Instructions
This is a ralph loop — you build, check, fix, repeat until it's done:
1. Scaffold + install deps
2. Build feature by feature
3. After each feature: `npm run build` — fix any TypeScript/build errors before moving on
4. Commit after each working feature
5. Final: deploy to Vercel, confirm it works, report back

## Done When
- [ ] App builds with `npm run build` (no errors)
- [ ] GitHub OAuth flow works end-to-end
- [ ] PR timeline loads real data
- [ ] Builder/Stakeholder toggle works
- [ ] Weekly summary generates + copies
- [ ] Deployed to Vercel
- [ ] All committed to git with clean history

## Notify when done
When completely finished, run:
```bash
openclaw system event --text "Done: DesignShip MVP built and deployed to Vercel. GitHub OAuth + PR timeline + stakeholder toggle + weekly summary — all working." --mode now
```
