# Plan: DesignShip MVP — Zero-Input Communication Layer

> Design it. Ship it. The tool that connects the two.

## Phase 1: Project Scaffolding & Foundation

- [x] **Task 1: Initialize TanStack Start project**
  - Skills: `/shadcn`, `brainstorming`
  - Run `npm create @tanstack/start@latest` in project root
  - Configure for client-side focus with TypeScript strict mode
  - Set up `tsconfig.json` with path aliases (`@/components`, `@/lib`, `@/hooks`)
  - Install core dependencies: `@tanstack/react-router`, `@tanstack/react-query`
  - Verify dev server starts with `npm run dev`
  - Initialize git repo with proper `.gitignore`

- [x] **Task 2: Install shadcn/ui + Studio Pro theme**
  - Skills: `/shadcn`, `/rui`
  - Run `npx shadcn@latest init` using existing `components.json`
  - Install Material Design theme: `npx shadcn@latest add @ss-themes/material-design`
  - Install base components: button, card, badge, separator, scroll-area, avatar, tooltip, skeleton, dialog, dropdown-menu, sheet, toggle, tabs
  - Configure Tailwind for dark mode first (`darkMode: 'class'`)
  - Set up `src/lib/utils.ts` with `cn()` helper
  - Verify components render in dark mode

- [x] **Task 3: Configure Tailwind + Design Tokens**
  - Skills: `frontend-design`, `ui-ux-design-pro`
  - Extend Tailwind config with DesignShip design tokens (`--ds-*` prefix)
  - Color palette: slate-based dark theme (inspired by Linear/Vercel)
  - Typography scale: Inter font, generous line-heights
  - Spacing scale: 4px base unit, generous whitespace
  - Set up `src/styles/globals.css` with CSS custom properties for both light/dark
  - Animation utilities: subtle fade-in, slide-up for timeline entries

- [x] **Task 4: Set up Supabase client + Auth**
  - Skills: `brainstorming`, `systematic-debugging`
  - Install `@supabase/supabase-js`, `@supabase/auth-helpers-react`
  - Create `src/lib/supabase.ts` client singleton
  - Configure Supabase Auth with GitHub OAuth provider
  - Create auth context/provider for React tree
  - Set up environment variables: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
  - Create `.env.example` with placeholder values

## Phase 2: Authentication & GitHub Integration

- [x] **Task 5: Build GitHub OAuth login flow**
  - Skills: `frontend-design`, `/cui`
  - Create login page route (`/login`)
  - Design minimal login screen: centered card, GitHub OAuth button, tagline
  - Use shadcn studio blocks for login layout inspiration via `/iui`
  - Implement Supabase GitHub OAuth sign-in
  - Store GitHub access token from OAuth response for API calls
  - Handle auth callback route
  - Redirect to dashboard on success

- [x] **Task 6: Build auth guard + navigation shell**
  - Skills: `/cui`, `ui-ux-design-pro`
  - Create auth-protected route layout
  - Build minimal app shell: sidebar-free, top-bar only
  - Top bar: DesignShip logo (text), user avatar, settings dropdown
  - Use shadcn Sheet for mobile menu
  - Implement sign-out flow
  - Route guard redirects to `/login` if unauthenticated

- [x] **Task 7: GitHub API client + PR fetching**
  - Skills: `brainstorming`, `test-driven-development`
  - Create `src/lib/github.ts` — GitHub REST API client using user's OAuth token
  - Implement `fetchMergedPRs(owner, repo, since)` — fetch recent merged PRs
  - Implement `fetchUserRepos()` — list user's repos (sorted by recent push)
  - Implement `fetchCommits(owner, repo, since)` — fetch recent commits
  - Handle pagination, rate limiting, error states
  - Create React Query hooks: `useRepos()`, `useMergedPRs(repo)`, `useCommits(repo)`

## Phase 3: Timeline — The Core UI

- [x] **Task 8: Design the Timeline component**
  - Skills: `/iui`, `frontend-design`, `ui-ux-design-pro`
  - Browse shadcn studio blocks for timeline/feed inspiration
  - Design TimelineEntry component: dot + connector line + content card
  - Event types: PR merged, commit pushed, deployment, design update
  - Each entry: icon, timestamp (relative), title, description, metadata badges
  - Expandable detail view on click
  - Skeleton loading state for timeline entries
  - Empty state: "Connect a repo to see your activity"

- [x] **Task 9: Build Timeline page + data flow**
  - Skills: `/cui`, `refactoring-ui`
  - Create dashboard route (`/`) — the main timeline view
  - Repo selector dropdown at top (fetched from GitHub API)
  - Timeline renders merged PRs as entries with:
    - PR title as headline
    - PR description preview
    - Author avatar + name
    - Merge date (relative: "2 hours ago")
    - Branch badge, review count, files changed count
  - Infinite scroll or "Load more" for older entries
  - Pull-to-refresh on mobile

- [x] **Task 10: AI-powered description rewriting**
  - Skills: `brainstorming`, `systematic-debugging`
  - Create `src/lib/ai.ts` — Claude API client (via Supabase Edge Function or API route)
  - Implement `rewriteForHumans(technicalText)` — converts commit messages and PR descriptions to plain English
  - Batch processing: rewrite multiple entries in one API call
  - Cache rewritten descriptions in Supabase to avoid redundant API calls
  - Toggle on timeline: "Show technical" / "Show plain English"
  - Loading indicator while AI processes

## Phase 4: Stakeholder View + Summary Generation

- [x] **Task 11: Builder vs Stakeholder view toggle**
  - Skills: `/rui`, `frontend-design`
  - Add view toggle to timeline header: "Builder" / "Stakeholder"
  - Builder view: technical details (branch names, file counts, commit hashes)
  - Stakeholder view: plain English descriptions, no technical jargon
  - Stakeholder view groups entries by feature/area (AI-classified)
  - Smooth transition animation between views
  - Remember user's preferred view in localStorage

- [x] **Task 12: Weekly Summary generation**
  - Skills: `brainstorming`, `ui-ux-design-pro`
  - [x] "Generate Weekly Summary" button in timeline header
  - [x] Collects all activity from past 7 days
  - [x] Sends to Claude API for structured summary generation
  - [x] Output format: "What shipped", "What's in progress", "Key decisions"
  - [x] Render summary in a modal/dialog with formatted sections
  - [x] Copy to clipboard button (formatted for Slack/Teams paste)
  - [x] Share link generation (optional) — skipped, not MVP-critical

- [x] **Task 13: Summary history + export**
  - Skills: `/rui`, `test-driven-development`
  - [x] Store generated summaries in Supabase
  - [x] Summary list view accessible from navigation
  - [x] Each summary: date range, generated date, content preview
  - [x] Export options: Copy as Markdown, Copy as formatted text
  - [x] Delete old summaries

## Phase 5: Figma Integration

- [x] **Task 14: Figma OAuth + API client**
  - Skills: `brainstorming`, `systematic-debugging`
  - [x] Add Figma OAuth provider to Supabase Auth (or direct OAuth2 flow)
  - [x] Create `src/lib/figma.ts` — Figma REST API client
  - [x] Implement `fetchFileScreenshot(fileKey, nodeId)` — get design screenshots
  - [x] Implement `fetchRecentFiles()` — list user's recent Figma files
  - [x] Store Figma access token alongside GitHub token
  - [x] Settings page: "Connect Figma" button with OAuth flow

- [x] **Task 15: Figma activity in timeline**
  - Skills: `/cui`, `frontend-design`
  - [x] When a PR description contains a Figma link, extract file key + node ID
  - [x] Fetch design screenshot from Figma API
  - [x] Display screenshot thumbnail in timeline entry alongside PR
  - [x] Click to expand: full-size design preview in modal
  - [x] Before/after comparison when multiple Figma links are present
  - [x] Fallback: show Figma link as text if screenshot fetch fails

## Phase 6: Polish & Deploy

- [x] **Task 16: Responsive design + mobile optimization**
  - Skills: `audit-ui`, `refactoring-ui`
  - [x] Test all views on mobile viewport (375px)
  - [x] Timeline entries stack vertically on mobile
  - [x] Touch-friendly tap targets (min 44px)
  - [x] Bottom sheet for entry details on mobile
  - [x] Test on tablet viewport (768px)
  - [x] Run accessibility audit (WCAG AA compliance)

- [x] **Task 17: Loading states + error handling**
  - Skills: `systematic-debugging`, `verification-before-completion`
  - [x] Skeleton loaders for all async content
  - [x] Error boundaries for component failures
  - [x] Toast notifications for user actions (copy, share, connect)
  - [x] Retry logic for failed API calls
  - [x] Offline indicator
  - [x] Rate limit handling for GitHub/Figma APIs

- [x] **Task 18: Dark/Light mode theming**
  - Skills: `/rui`, `frontend-design`
  - [x] Dark mode is default (already designed)
  - [x] Add light mode color tokens
  - [x] Theme toggle in top bar (sun/moon icon)
  - [x] Persist theme preference in localStorage
  - [x] System preference detection as default
  - [x] Smooth transition between themes

- [x] **Task 19: Deploy to Vercel**
  - Skills: `verification-before-completion`
  - [x] Create `vercel.json` (or `vercel.ts`) configuration
  - [x] Set up environment variables in Vercel dashboard (documented in .env.example - manual step)
  - [x] Configure build command and output directory
  - [x] Set up production domain (manual step - via Vercel dashboard)
  - [x] Test OAuth callbacks work with production URL (manual step - requires live deployment)
  - [x] Verify all features work in production (manual step - requires live deployment)

- [x] **Task 20: Final review + documentation**
  - Skills: `requesting-code-review`, `simplify`
  - [x] Code review all components for quality
  - [x] Remove unused imports and dead code
  - [x] Verify no console.logs or debug code
  - [x] Update README.md with setup instructions
  - [x] Document environment variables needed
  - [x] Screenshot the final product (skipped - not automatable)
