# PRD 04 — AI Output Generation

## Goal
Build the `/outputs` hub — 7 output types generated via Vercel AI SDK + Gemini 2.0 Flash, with streaming UI, save, and share.

## AI Setup
`src/lib/generate.ts`:
```typescript
import { generateText, streamText } from 'ai'
import { google } from '@ai-sdk/google'
import { anthropic } from '@ai-sdk/anthropic'

const model = process.env.GOOGLE_GENERATIVE_AI_API_KEY
  ? google('gemini-2.0-flash')
  : process.env.ANTHROPIC_API_KEY
    ? anthropic('claude-3-5-haiku-latest')
    : null  // fallback to deterministic templates
```

## API Endpoint
`api/generate.ts` — POST with streaming:
```typescript
// Body: { type, tone, dateRange, userId }
// 1. Fetch relevant PRs + frames from Supabase for the date range
// 2. Assemble context string
// 3. Stream AI response back
// 4. On completion: save to outputs table, return share_id
```

## Output Types + Prompts

### weekly_update (builder / stakeholder / achievement tones)
Context: all PRs + Figma frames from last 7 days
- Builder tone: "List what was merged, technical detail OK, keep it scannable"
- Stakeholder tone: "Plain English, what changed for users, no jargon"
- Achievement tone: "Impact-framed, metric-forward, suitable for job apps and perf reviews"

### status_update
Short (3-5 sentences): what's done, what's in progress, what's next
Context: today + open PRs

### case_study
Longer narrative: design decision → what was built → outcome
Context: one artifact (PR + Figma frame pair) + any notes

### design_doc
Figma-first: component specs, design decisions, rationale
Context: Figma frame data + annotations

### handoff_doc
Design + code + context for a new dev or client
Context: artifact pair + PR description + Figma annotations

### user_docs
Feature-level explanation for end users
Context: PR descriptions rewritten as feature docs

### system_docs  
Technical overview: what changed, architecture notes
Context: PR diffs + commit messages

## Deterministic Fallback
`src/lib/templates.ts` — when no AI key:
- weekly_update: "This week: [list PR titles rewritten]. [N] PRs merged across [repos]."
- status_update: "Done: [today's PRs]. Working on: [open PRs]."
- etc. — simple but functional

## Output Panel UI
`src/components/output-panel.tsx`:
- Slide-out drawer (shadcn Sheet)
- Output type selector: 7 types as tabs or dropdown
- Tone selector (for weekly_update): Builder / Stakeholder / Achievement pills
- Date range: This Week / This Month / Custom
- "Generate" button → streams text into panel with typewriter animation
- Rendered as markdown (use react-markdown or simple markdown renderer)
- Actions: Copy to clipboard / Regenerate / Save / Share
- Share: copies `/outputs/[share_id]` URL to clipboard

## `/outputs` Route
`src/routes/outputs/index.tsx`:
- Grid of saved outputs (cards: type, created date, first 100 chars)
- "New Output" button → opens output panel
- Quick actions per card: copy, share, delete

## `/outputs/$id` Route  
`src/routes/outputs/$id.tsx`:
- Full output view
- Edit inline (contenteditable or textarea)
- Share button
- "Regenerate" button

## Public Share (`/share/$shareId`)
`src/routes/share/$shareId.tsx`:
- No auth required
- Shows output in read-only view
- DesignShip branding at bottom: "Made with DesignShip"
- Feedback input (links to PRD 05)

## Done when
- [ ] `api/generate.ts` streams AI responses
- [ ] All 7 output types generate (AI or fallback)
- [ ] Output panel UI with streaming text
- [ ] Outputs saved to Supabase
- [ ] Share links work (no auth)
- [ ] `/outputs` grid renders saved outputs
- [ ] `npm run build` passes
- [ ] Committed: `feat: AI output generation — 7 types, streaming UI, share links`
