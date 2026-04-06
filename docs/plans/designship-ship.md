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
- [ ] `git push -u origin master` (or `main` — whichever the local branch is named)
- [ ] `gh repo view --web` to confirm the repo loads in the browser, OR `gh repo view` to see the repo summary in the terminal
- [ ] Verify the README renders correctly on GitHub
- [ ] **No commit for this task — push only.** The repo URL should be captured in the loop output for use in later tasks.

**Skills:** none
**Files:** none

### Task 14: Capture the timeline screenshot for the README
- [ ] Start the dev server: `npm run dev`
- [ ] Sign in via the local app, browse a connected repo, let the timeline render with at least 5 entries
- [ ] Use `chrome-devtools-mcp` to navigate to `http://localhost:3000` and `take_screenshot` of the timeline at 1440×900 viewport
- [ ] Save as `public/screenshot-timeline.png` (overwrite the placeholder from Task 2)
- [ ] Verify the README image now shows the real screenshot in a markdown preview
- [ ] Commit: `docs: replace placeholder with real timeline screenshot`

**Skills:** `chrome-devtools-mcp:chrome-devtools`, `web-design-reviewer`
**Files:** `public/screenshot-timeline.png`

### Task 15: Add GitHub repo topics + description
- [ ] `gh repo edit --add-topic tanstack,react,supabase,vercel,github-oauth,figma,claude-ai,zero-input,communication,timeline`
- [ ] Verify with `gh repo view` that topics were added
- [ ] **No commit for this task — GitHub metadata only.**

**Skills:** none
**Files:** none

---

## Phase 3 — Vercel Deployment

### Task 16: Install Vercel CLI globally
- [ ] `npm i -g vercel` (or `pnpm add -g vercel`)
- [ ] `vercel --version` reports the installed version
- [ ] **No commit for this task — install only.** Surface the installed version in the loop output.

**Skills:** `vercel-cli`
**Files:** none

### Task 17: Authenticate with Vercel
- [ ] `vercel login` and complete the email/SSO flow
- [ ] `vercel whoami` returns the authenticated user
- [ ] `vercel teams ls` shows available teams; switch to the right team with `vercel teams switch <slug>` if needed
- [ ] **No commit for this task — auth only.**

**Skills:** `vercel-cli`
**Files:** none

### Task 18: Verify vercel.json + app.config.ts are correct for Vercel
- [ ] Dispatch `Explore` to read `vercel.json` and `app.config.ts` and confirm:
  - `vercel.json` has `framework: null` and `outputDirectory: .output`
  - `app.config.ts` has `server: { preset: 'vercel' }` (per `CLAUDE.md` Tech Stack table)
- [ ] If either is wrong, fix it. Dispatch `Reviewer` after any edit.
- [ ] Commit: `vercel: verify vercel.json + app.config.ts preset` (only if a change was needed)

**Skills:** `vercel-cli`
**Files:** `vercel.json`, `app.config.ts` (only if changes needed)

### Task 19: Link the local project to a new Vercel project
- [ ] `vercel link` from the repo root
- [ ] When prompted: "Set up and deploy?" — yes; "Which scope?" — pick the right team; "Link to existing project?" — no; "Project name?" — `designship`; "In which directory is your code located?" — `./`
- [ ] Confirm `.vercel/project.json` exists with `projectId` and `orgId`
- [ ] `.vercel/` is already gitignored — verify `git status` does NOT show it as untracked
- [ ] **No commit for this task — link only.** Note the project ID in the loop output.

**Skills:** `vercel-cli`
**Files:** `.vercel/project.json` (gitignored)

### Task 20: Add Supabase env vars to Vercel
- [ ] `vercel env add VITE_SUPABASE_URL` — paste the Supabase URL, scope to Production + Preview + Development
- [ ] `vercel env add VITE_SUPABASE_ANON_KEY` — paste the anon key, all 3 scopes
- [ ] `vercel env ls` shows both new vars across all 3 environments
- [ ] **No commit for this task — env vars are server-side only.**

**Skills:** `vercel-cli`, `vercel:env-vars`
**Files:** none

### Task 21: Add Anthropic API key to Vercel (server-only)
- [ ] `vercel env add ANTHROPIC_API_KEY` — paste the key, scope to Production + Preview + Development
- [ ] **Confirm the variable name has NO `VITE_` prefix** so it stays out of the client bundle
- [ ] `vercel env ls | grep ANTHROPIC` confirms it landed
- [ ] **No commit for this task.**

**Skills:** `vercel-cli`, `vercel:env-vars`
**Files:** none

### Task 22: Add Figma OAuth env vars to Vercel
- [ ] `vercel env add VITE_FIGMA_CLIENT_ID` — paste, all 3 scopes
- [ ] `vercel env add FIGMA_CLIENT_ID` — paste, all 3 scopes
- [ ] `vercel env add FIGMA_CLIENT_SECRET` — paste, all 3 scopes (server-only, no `VITE_` prefix)
- [ ] `vercel env ls | grep FIGMA` shows all 3
- [ ] **No commit for this task.**

**Skills:** `vercel-cli`, `vercel:env-vars`
**Files:** none

### Task 23: Add SITE_URL placeholder to Vercel
- [ ] `vercel env add SITE_URL` — for Production paste `https://designship.vercel.app` (placeholder, will be updated after first deploy if Vercel assigns a different domain), for Preview paste `https://$VERCEL_URL`, for Development paste `http://localhost:3000`
- [ ] `vercel env ls | grep SITE_URL` shows all 3
- [ ] **No commit for this task.**

**Skills:** `vercel-cli`, `vercel:env-vars`
**Files:** none

### Task 24: Pull the env config locally for verification
- [ ] `vercel env pull .env.vercel.local` — pulls Development-scoped env vars to a local file
- [ ] Inspect the file: every variable from `.env.example` should be present
- [ ] Delete the file after inspection: `rm .env.vercel.local` (it's gitignored anyway, but no need to keep it around)
- [ ] **No commit for this task — verification only.**

**Skills:** `vercel-cli`, `vercel:env-vars`
**Files:** `.env.vercel.local` (created then deleted)

### Task 25: Run a preview deployment
- [ ] `vercel deploy` (no `--prod` flag — this is a preview deployment)
- [ ] Capture the preview URL printed to stdout
- [ ] If the build fails, read the build logs (`vercel inspect <deployment-url> --logs` or follow the link in the CLI output) and fix root cause
- [ ] Re-run `vercel deploy` until it succeeds
- [ ] **No commit for this task** unless build fixes were needed; if so, commit with: `vercel: fix preview build`

**Skills:** `vercel-cli`, `vercel:deployments-cicd`
**Files:** whichever build fixes were needed

### Task 26: Smoke-test the preview deployment
- [ ] Open the preview URL in a browser (use `chrome-devtools-mcp` `navigate_page`)
- [ ] Verify: the login page renders, the GitHub OAuth button appears, the dark theme is the default
- [ ] Check the browser console for errors (`list_console_messages` filtered to errors)
- [ ] Check network requests for any 404s or 500s on initial load (`list_network_requests`)
- [ ] If anything is broken, return to the failing MVP task to fix it; do NOT paper over with a hotfix
- [ ] Take a screenshot at 1440×900 saved to `.ralphex/screenshots/preview-deploy.png`
- [ ] Commit: `qa: preview deployment smoke test passed` (commits the screenshot)

**Skills:** `vercel-cli`, `chrome-devtools-mcp:chrome-devtools`, `vercel:verification`
**Files:** `.ralphex/screenshots/preview-deploy.png`

### Task 27: Update Supabase redirect URLs for the production domain
- [ ] Open Supabase dashboard → Authentication → URL Configuration → Redirect URLs
- [ ] Add: `https://designship.vercel.app/auth/callback` and the actual preview URL pattern `https://designship-*.vercel.app/auth/callback`
- [ ] Add: `https://designship.vercel.app/auth/figma-callback` and `https://designship-*.vercel.app/auth/figma-callback`
- [ ] Save
- [ ] **No commit for this task — Supabase dashboard work only.** Note the saved URLs in the loop output.

**Skills:** none
**Files:** none

### Task 28: Update GitHub OAuth App callback URL
- [ ] Open https://github.com/settings/developers → the DesignShip OAuth App
- [ ] Set Authorization callback URL to `https://<supabase-project>.supabase.co/auth/v1/callback` (this stays the same — Supabase handles the OAuth dance)
- [ ] Confirm the Homepage URL matches the production Vercel domain
- [ ] **No commit for this task — GitHub OAuth App settings only.**

**Skills:** none
**Files:** none

### Task 29: Update Figma OAuth App callback URL
- [ ] Open https://www.figma.com/developers/apps → the DesignShip app
- [ ] Set the Callback URL to `https://designship.vercel.app/auth/figma-callback`
- [ ] Save
- [ ] **No commit for this task — Figma developer app settings only.**

**Skills:** none
**Files:** none

### Task 30: Promote to production
- [ ] `vercel --prod` from the repo root
- [ ] Capture the production URL printed to stdout
- [ ] If the build fails, read the build logs and fix root cause; re-run `vercel --prod` until it succeeds
- [ ] **No commit for this task** unless build fixes were needed.

**Skills:** `vercel-cli`, `vercel:deployments-cicd`
**Files:** whichever build fixes were needed

### Task 31: Smoke-test the production deployment end-to-end
- [ ] Open the production URL in a browser
- [ ] Sign in with GitHub OAuth — confirm the callback completes and the timeline loads
- [ ] Verify a connected repo's merged PRs render in the timeline
- [ ] Toggle Builder ↔ Stakeholder view — verify the AI rewrite runs without error
- [ ] Generate a weekly summary — verify the dialog opens and the summary text appears
- [ ] (Optional) Connect Figma and verify the Figma OAuth flow completes
- [ ] Take a screenshot of the production timeline at 1440×900 saved to `public/screenshot-timeline.png` (overwrites the dev screenshot from Task 14 with the polished prod version)
- [ ] Commit: `qa: production smoke test + final timeline screenshot`

**Skills:** `vercel-cli`, `chrome-devtools-mcp:chrome-devtools`, `vercel:verification`
**Files:** `public/screenshot-timeline.png`

---

## Phase 4 — Final Documentation Pass

### Task 32: Add the live production URL to the README
- [ ] Add a "Live demo" badge or link near the top of the README pointing at the production Vercel URL
- [ ] Add the URL to the `gh repo edit --homepage <url>` so the GitHub repo sidebar shows it
- [ ] Commit: `readme: add live demo URL`

**Skills:** none
**Files:** `README.md`

### Task 33: Add deployment status badge to README
- [ ] Add a Vercel deploy status badge at the top of the README (`![Vercel](https://vercelbadge.vercel.app/api/<user>/designship)` or the official Vercel badge)
- [ ] Commit: `readme: add Vercel deploy status badge`

**Skills:** none
**Files:** `README.md`

### Task 34: Push final commits + verify GitHub state
- [ ] `git push origin master` (or `main`)
- [ ] `gh repo view` confirms the README, topics, and homepage URL are all updated
- [ ] `gh run list --limit 5` confirms (if any GitHub Actions exist) that they pass; if no Actions yet, this is fine
- [ ] `vercel ls --limit 5` confirms the latest production deployment is healthy
- [ ] **No commit for this task — verification only.**

**Skills:** none
**Files:** none

### Task 35: Write a release-notes entry for v0.1.0
- [ ] Create or update `CHANGELOG.md` with a `## v0.1.0 — Initial Release` section listing the shipped features (mirror the README Features section, but past-tense)
- [ ] Tag the release: `git tag -a v0.1.0 -m "Initial release"` then `git push --tags`
- [ ] `gh release create v0.1.0 --title "v0.1.0 — Initial Release" --notes-from-tag`
- [ ] Commit: `meta: changelog v0.1.0 + release tag`

**Skills:** `superpowers:writing-skills`
**Files:** `CHANGELOG.md`
