# Plan: DesignShip — Document, Push, Deploy

> **For ralphex.** The MVP build plan (`designship-mvp.md`) is complete. This plan polishes the README, creates a fresh GitHub repo, and ships the project to Vercel for production. Each task ends with a commit.

Source: `CLAUDE.md` (project spec), the existing `README.md`, and the Vercel CLI docs (`https://vercel.com/docs/cli`).

---

## Commit protocol

**Every task ends with a commit.** The last checkbox of every task is the commit itself.

```
- [ ] Commit: `<scope>: <short imperative summary>` — body references task number + files touched
```

Valid scopes: `docs`, `readme`, `deploy`, `vercel`, `gh`, `env`, `ci`, `meta`, `qa`.

**Commit rules:**
- Conventional Commits format
- Stage specific files, not `git add .` — inspect `git status` first
- No `--no-verify`, no `--amend` on published commits, no `--force`
- One commit per task

---

## How ralphex uses subagents

Same rules as `designship-mvp.md`:
- **Never read more than 2 files inline** — dispatch `Explore`
- **Never write a script from scratch inline** — dispatch `Architect` first
- **Always dispatch `Reviewer` then `Simplifier`** before committing any new file
- **Parallelise independent subagents** in a single message
- **Stuck 3+ iterations on the same task?** Dispatch `Codex-Rescue`

### Subagent shorthand

| Shorthand | Agent type | Use for |
|---|---|---|
| `Explore` | `Explore` | Codebase queries, finding files, reading conventions |
| `Architect` | `feature-dev:code-architect` | Designing scripts/configs before writing |
| `Reviewer` | `feature-dev:code-reviewer` | Bug/logic review pre-commit |
| `PR-Reviewer` | `pr-review-toolkit:code-reviewer` | Style + convention review pre-commit |
| `Simplifier` | `pr-review-toolkit:code-simplifier` | Strip dead code / over-abstraction |
| `Frontend` | `frontend-design:frontend-design` | Visual direction + design |
| `Codex-Rescue` | `codex:codex-rescue` | Escape hatch when stuck 3+ iterations |

### Skill loading

Every task names the skills under **Skills:**. Load them via the `Skill` tool before starting.

---

## Phase 1 — README & Documentation

### Task 1: Audit current README and identify gaps
- [x] Read the existing `README.md` end-to-end
- [x] List which sections exist vs the standard structure (Overview, Features, Quick start, Tech stack, Setup, Environment variables, Development, Architecture, Deployment, License)
- [x] Read `CLAUDE.md` and the file structure under `app/` + `src/lib/` + `src/hooks/` to understand what should actually be documented
- [x] Write a short gap report to `.ralphex/notes/readme-gap.md` (≤ 30 lines) listing every section that needs writing or rewriting and what each should cover
- [x] Commit: `docs: audit README and document gaps`

**Skills:** `superpowers:writing-skills`
**Subagents:** `Explore` × 2 in parallel — (a) read `app/routes/` + `src/lib/` to map the routes and library modules, (b) read the existing `README.md` and report what's already there
**Files:** `.ralphex/notes/readme-gap.md` (new)

### Task 2: Write README hero + tagline + screenshot block
- [x] Top of README: project name, tagline, one-line value prop, badges row (license, framework, status), and a placeholder `![DesignShip Timeline](public/screenshot-timeline.png)` for the timeline screenshot
- [x] Tagline must match `CLAUDE.md`: "Design it. Ship it. The tool that connects the two."
- [x] One-line value prop: "Zero-input communication layer that turns your GitHub + Figma activity into standups, release notes, and stakeholder updates."
- [x] Add `public/screenshot-timeline.png` placeholder file (1×1 transparent PNG is fine for now — the real screenshot is captured in Task 14)
- [x] Commit: `readme: add hero + tagline + screenshot placeholder`

**Skills:** `superpowers:writing-skills`, `frontend-design`
**Files:** `README.md`, `public/screenshot-timeline.png`

### Task 3: Write Features section
- [x] List the shipped features from `designship-mvp.md`: GitHub OAuth, repo selector, merged-PR timeline, AI plain-English rewriting, Builder/Stakeholder view toggle, weekly summary generator, summary history, Figma OAuth, Figma screenshots in timeline, dark/light theme, mobile responsive
- [x] Each feature is a single bullet, leading with a verb and ≤ 14 words
- [x] Group as: **Core**, **Integrations**, **AI-powered**, **Polish**
- [x] Commit: `readme: write Features section grouped by category`

**Skills:** `superpowers:writing-skills`
**Files:** `README.md`

### Task 4: Write Tech Stack section
- [x] Mirror the table from `CLAUDE.md` "Tech Stack Details"
- [x] Columns: Layer, Technology, Purpose
- [x] Include: TanStack Start, Vinxi, React 19, TypeScript, Tailwind CSS v4, shadcn/ui + Studio Pro, Supabase, Claude API (sonnet-4), GitHub REST API, Figma REST API, Vercel
- [x] Add a sentence below the table noting that server-only secrets (`ANTHROPIC_API_KEY`, `FIGMA_CLIENT_SECRET`) are accessed via TanStack server functions
- [x] Commit: `readme: write Tech Stack section`

**Skills:** `superpowers:writing-skills`
**Files:** `README.md`

### Task 5: Write Quick Start section
- [x] Prereqs: Node ≥ 20, pnpm or npm, a Supabase project, a GitHub OAuth App, optional Figma OAuth App, Anthropic API key
- [x] Steps:
  1. `git clone <repo>`
  2. `cd designship`
  3. `cp .env.example .env` and fill in values
  4. `npm install`
  5. `npm run dev`
  6. Open `http://localhost:3000`
- [x] Note that the Vercel deployment URL will be added after Phase 2
- [x] Commit: `readme: write Quick Start section`

**Skills:** `superpowers:writing-skills`
**Files:** `README.md`

### Task 6: Write Environment Variables section
- [x] Read `.env.example` and list every variable with: name, required/optional, where to get it, whether it's client (`VITE_*`) or server-only
- [x] Render as a markdown table with columns: Variable, Required, Scope, Description
- [x] Below the table, add a callout: server-only secrets must NOT be prefixed with `VITE_` to keep them out of the client bundle
- [x] Commit: `readme: document environment variables`

**Skills:** `superpowers:writing-skills`
**Files:** `README.md`

### Task 7: Write Development & Architecture sections
- [x] **Development** subsection: `npm run dev`, `npm run build`, `npm run preview`, `npm run lint`, `npm run typecheck` — what each does and when to use it
- [x] **Architecture** subsection: route structure (file-based via TanStack Router), `app/routes/_authenticated/*` for protected pages, `src/lib/` for clients (Supabase, GitHub, Figma, Claude), `src/hooks/` for React Query data fetching, server functions in `src/lib/ai.ts` and `src/lib/figma.ts`
- [x] Mention the Supabase lazy-proxy pattern and the `ds-*` localStorage prefix from `CLAUDE.md`
- [x] Commit: `readme: write Development + Architecture sections`

**Skills:** `superpowers:writing-skills`
**Files:** `README.md`

### Task 8: Write Deployment section (Vercel)
- [x] Step 1: install Vercel CLI (`npm i -g vercel`)
- [x] Step 2: `vercel login`
- [x] Step 3: `vercel link` (single project)
- [x] Step 4: add env vars via `vercel env add` for each variable in `.env.example`, scope to Production + Preview + Development
- [x] Step 5: `vercel --prod` for first production deploy
- [x] Mention that `vercel.json` already sets `framework: null` and `outputDirectory: .output` for TanStack Start (per `CLAUDE.md`)
- [x] Add a note about updating Supabase Auth redirect URLs and Figma OAuth callback URLs to the production domain after first deploy
- [x] Commit: `readme: write Vercel Deployment section`

**Skills:** `superpowers:writing-skills`, `vercel-cli`
**Files:** `README.md`

### Task 9: Write Contributing + License sections
- [x] **Contributing**: PRs welcome, run `npm run lint && npm run typecheck` before opening, follow Conventional Commits
- [x] **License**: link to `LICENSE` (create `LICENSE` as MIT if it doesn't exist)
- [x] Commit: `readme: add Contributing + License sections`

**Skills:** `superpowers:writing-skills`
**Files:** `README.md`, `LICENSE` (new if missing)

### Task 10: Add table of contents + final README review
- [x] Generate a TOC at the top under the hero block, linking to every H2
- [x] Re-read the full README and fix any ordering issues, broken links, or stale references
- [x] Run a markdown lint (or visual check) for heading hierarchy
- [x] Dispatch `PR-Reviewer` to confirm structure, tone, and accuracy against `CLAUDE.md`
- [x] Commit: `readme: add table of contents + final review`

**Skills:** `superpowers:writing-skills`
**Files:** `README.md`

---

## Phase 2 — GitHub Repository

### Task 11: Verify gh CLI auth + clean working tree
- [x] `gh --version` reports a version (already installed at v2.88+)
- [x] `gh auth status` shows a logged-in user; if not, run `gh auth login` and use the GitHub.com / HTTPS / browser flow
- [x] `git status --short` is clean (commit any pending work first, including any docs work from Phase 1 that hasn't landed)
- [x] `git log --oneline -5` shows the last 5 commits — confirm they look healthy
- [x] **No commit for this task — precondition check only.** If anything fails, stop and surface the failure.

**Skills:** none
**Files:** none

### Task 12: Create the GitHub repository via gh CLI
- [x] `gh repo create designship --public --source=. --description "Zero-input communication layer for GitHub + Figma activity. Generates standups, release notes, and stakeholder updates."`
- [x] Do NOT pass `--push` yet — we want to inspect remotes first
- [x] `git remote -v` shows the new `origin` pointing at `github.com/<user>/designship.git`
- [x] `git remote get-url origin` returns the expected HTTPS URL
- [x] **No commit for this task — repo creation only.** Note the repo URL in the loop output.

**Skills:** none
**Files:** none

### Task 13: Push initial history to GitHub
- [x] `git push -u origin master` (or `main` — whichever the local branch is named)
- [x] `gh repo view --web` to confirm the repo loads in the browser, OR `gh repo view` to see the repo summary in the terminal
- [x] Verify the README renders correctly on GitHub
- [x] **No commit for this task — push only.** The repo URL should be captured in the loop output for use in later tasks.

**Skills:** none
**Files:** none


### Task 14: Capture timeline screenshot + add GitHub repo metadata
- [ ] Start dev server (`npm run dev`), sign in, open a connected repo until the timeline renders ≥ 5 entries
- [ ] Use `chrome-devtools-mcp` to capture at 1440×900, save to `public/screenshot-timeline.png` (overwrite the placeholder)
- [ ] `gh repo edit --add-topic tanstack,react,supabase,vercel,github-oauth,figma,claude-ai,zero-input,communication,timeline`
- [ ] `gh repo edit --homepage "https://<to-be-set-in-task-20>"` (placeholder — real URL set after prod deploy)
- [ ] `gh repo view` confirms topics landed
- [ ] Commit: `docs: real timeline screenshot + GitHub topics`

**Skills:** `chrome-devtools-mcp:chrome-devtools`, `web-design-reviewer`
**Files:** `public/screenshot-timeline.png`

---

## Phase 3 — Vercel Deployment

> **Knowledge update (2026-02):** Vercel now runs on **Fluid Compute** by default (same regions + price as old Edge, but full Node.js support). **Node.js 24 LTS** is the default runtime. Default function timeout is **300s**. `vercel.ts` is the new recommended config format — `vercel.json` still works, so we stay on it unless a migration is needed. Server-only secrets (no `VITE_` prefix) never leak into the client bundle.

### Task 15: Install + auth + link Vercel, verify deploy config
- [ ] `npm i -g vercel` then `vercel --version` (CLI is NOT installed yet)
- [ ] `vercel login` and complete SSO; `vercel whoami` returns the expected user; `vercel teams switch <slug>` if needed
- [ ] Dispatch `Explore` to read `vercel.json` and `app.config.ts` and confirm: `vercel.json` has `framework: null` + `outputDirectory: .output`, and `app.config.ts` has `server: { preset: 'vercel' }` (per `CLAUDE.md` Tech Stack table). Fix either if wrong.
- [ ] `vercel link` from repo root → team + project name `designship` + `./` directory. Confirm `.vercel/project.json` exists and is gitignored.
- [ ] Commit: `vercel: link project + verify deploy config` (only if config edits were needed; otherwise no-commit for install/auth/link)

**Skills:** `vercel-cli`, `vercel:deployments-cicd`
**Subagents:** `Explore` (config audit), `Reviewer` (only if edits were needed)
**Files:** `vercel.json`, `app.config.ts` (only if a fix was needed)

### Task 16: Push all env vars to Vercel + verify
- [ ] `vercel env add` for each var in `.env.example`, scoping every one to Production + Preview + Development:
  - `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
  - `ANTHROPIC_API_KEY` (**no** `VITE_` prefix — server-only)
  - `VITE_FIGMA_CLIENT_ID`, `FIGMA_CLIENT_ID`, `FIGMA_CLIENT_SECRET` (last one server-only)
  - `SITE_URL` (Prod: `https://designship.vercel.app`, Preview: `https://$VERCEL_URL`, Dev: `http://localhost:3000`)
- [ ] `vercel env ls` shows every variable across all 3 environments
- [ ] `vercel env pull .env.vercel.local --yes` → inspect that the pulled Development-scoped file matches `.env.example`, then `rm .env.vercel.local` (the `--yes` flag skips the overwrite prompt so this works non-interactively)
- [ ] **No commit — env vars are server-side only.** Log the var count to the loop output.

**Skills:** `vercel-cli`, `vercel:env-vars`
**Files:** `.env.vercel.local` (created then deleted)

### Task 17: Preview deploy + smoke test
- [ ] `vercel deploy` (no `--prod`); capture the preview URL
- [ ] If the build fails: `vercel inspect <url> --logs`, fix root cause, re-run — do NOT paper over errors
- [ ] Use `chrome-devtools-mcp` to `navigate_page` to the preview URL at 1440×900
- [ ] Verify: login page renders, GitHub OAuth button visible, dark theme default
- [ ] `list_console_messages` filtered to errors — zero errors expected
- [ ] `list_network_requests` — no 4xx/5xx on initial load
- [ ] `take_screenshot` → `.ralphex/screenshots/preview-deploy.png`
- [ ] Commit: `qa: preview deploy smoke test passed` (commits the screenshot; include any build fixes in the same commit if they were needed)

**Skills:** `vercel-cli`, `vercel:deployments-cicd`, `chrome-devtools-mcp:chrome-devtools`, `vercel:verification`
**Files:** `.ralphex/screenshots/preview-deploy.png`, any build fixes

### Task 18: Update OAuth callback URLs across all three providers
- [ ] **Supabase** dashboard → Authentication → URL Configuration → Redirect URLs: add `https://designship.vercel.app/auth/callback`, `https://designship-*.vercel.app/auth/callback`, `https://designship.vercel.app/auth/figma-callback`, `https://designship-*.vercel.app/auth/figma-callback`
- [ ] **GitHub OAuth App** (https://github.com/settings/developers): confirm Authorization callback URL is `https://<supabase-project>.supabase.co/auth/v1/callback` and Homepage URL matches the production Vercel domain
- [ ] **Figma Developer App** (https://www.figma.com/developers/apps): set Callback URL to `https://designship.vercel.app/auth/figma-callback`
- [ ] Note the saved URLs in the loop output as evidence
- [ ] **No commit — all work is external dashboard config.**

**Skills:** none
**Files:** none

### Task 19: Promote to production + end-to-end smoke test
- [ ] `vercel --prod` from repo root; capture the production URL
- [ ] If the build fails: read logs, fix root cause, re-run
- [ ] Use `chrome-devtools-mcp` to drive a real signed-in flow on the production URL:
  1. GitHub OAuth sign-in → callback completes → timeline loads
  2. Select a connected repo → merged PRs render
  3. Toggle Builder ↔ Stakeholder view → AI rewrite runs without error
  4. Generate a weekly summary → dialog opens, summary text appears
  5. (Optional) Connect Figma → OAuth flow completes
- [ ] `take_screenshot` of the production timeline at 1440×900 → overwrite `public/screenshot-timeline.png` with the polished prod version
- [ ] Commit: `qa: production deploy + e2e smoke test` (includes the replacement screenshot and any build fixes)

**Skills:** `vercel-cli`, `vercel:deployments-cicd`, `chrome-devtools-mcp:chrome-devtools`, `vercel:verification`
**Files:** `public/screenshot-timeline.png`, any build fixes

---

## Phase 4 — Final Documentation Pass

### Task 20: README badges, live URL, changelog, release, push
- [ ] Add Vercel deploy status badge near the top of `README.md`
- [ ] Add "Live demo" link to the hero block pointing at the production Vercel URL
- [ ] `gh repo edit --homepage <production-url>` so the GitHub sidebar shows the live URL
- [ ] Create or update `CHANGELOG.md` with a `## v0.1.0 — Initial Release` section mirroring the Features section (past-tense)
- [ ] `git tag -a v0.1.0 -m "Initial release"` then `git push --tags`
- [ ] `gh release create v0.1.0 --title "v0.1.0 — Initial Release" --notes-from-tag`
- [ ] `git push origin` (current branch); `gh repo view` confirms README + topics + homepage are updated; `vercel ls --limit 3` confirms latest prod deploy is healthy
- [ ] Commit: `meta: v0.1.0 release — badges, live URL, changelog, tag`

**Skills:** `vercel-cli`
**Files:** `README.md`, `CHANGELOG.md`
