# PRD 03 — Unified Timeline + Auto-Pairing

## Goal
Upgrade the timeline to show paired GitHub PR + Figma design as one artifact card. Add heatmap. Build the auto-pairing algorithm.

## Route
`src/routes/timeline/index.tsx` (upgrade existing dashboard)

## Auto-Pairing Algorithm
Create `src/lib/pairing.ts`:

```typescript
export function computePairingConfidence(pr: GithubPR, frame: FigmaFrame): number {
  let score = 0;
  
  // 1. Time proximity (max 0.4)
  const daysDiff = Math.abs(
    (new Date(pr.merged_at).getTime() - new Date(frame.last_modified).getTime()) 
    / (1000 * 60 * 60 * 24)
  );
  if (daysDiff <= 1) score += 0.4;
  else if (daysDiff <= 3) score += 0.25;
  else if (daysDiff <= 7) score += 0.1;

  // 2. Name similarity (max 0.4)
  const prWords = tokenize(pr.title + ' ' + pr.branch);
  const frameWords = tokenize(frame.frame_name + ' ' + frame.file_name);
  const overlap = prWords.filter(w => frameWords.includes(w)).length;
  const maxWords = Math.max(prWords.length, frameWords.length);
  score += (overlap / maxWords) * 0.4;

  // 3. Repo/file name match (max 0.2)
  const repoName = pr.repo.split('/').pop()?.toLowerCase() || '';
  if (frame.file_name.toLowerCase().includes(repoName)) score += 0.2;

  return Math.min(score, 1);
}

function tokenize(str: string): string[] {
  return str.toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2 && !STOP_WORDS.includes(w));
}

const STOP_WORDS = ['feat', 'fix', 'chore', 'the', 'and', 'for', 'with', 'add', 'update', 'from'];
```

Run pairing in `api/sync.ts`:
- For each unmatched PR, check all frames within ±7 days
- If confidence > 0.6 → create artifact with auto match
- If 0.3–0.6 → create artifact as "suggestion" (show in UI for manual confirmation)

## Artifact Card Component
`src/components/artifact-card.tsx`:

Layout (two-panel card):
```
┌─────────────────────────────────────────────────────┐
│ [Figma thumbnail 80x60]  │  ✨ feat  repo/name       │
│                          │  PR Title                  │
│   [frame name]           │  Merged Mar 27 · 3 commits │
│                          │  🔗 auto-matched           │
└─────────────────────────────────────────────────────┘
```

- Left: Figma frame thumbnail (if paired) or placeholder pattern
- Right: PR info — type badge, title, repo, merged date, commit count
- Pairing indicator: chain link icon + "auto-matched" or "manual" badge
- If unmatched: show only the PR or only the Figma frame as a solo card
- Click: expand to full detail view (sheet/drawer)

## Heatmap Component
`src/components/heatmap.tsx`:
- 52 weeks × 7 days grid (like GitHub contributions)
- Color: dusty rose `#c9a8a8` intensity scale (0 = transparent, max = full color)
- Data: count of (PRs merged + Figma frames modified) per day
- Tooltip on hover: "Mar 27 — 3 PRs merged, 2 Figma frames"
- Query last 365 days from Supabase

## Timeline Filters
- Date range: Today / This Week / This Month / Custom (date picker)
- Group by: Day / Project / Type
- Type filter chips: ✨ Shipped / 🐛 Fixed / 🎨 Designed / 🧹 Cleaned Up
  - Derived from PR conventional commit prefix (feat→Shipped, fix→Fixed, style/refactor→Cleaned Up)
  - Figma-only items → Designed

## Done when
- [ ] Pairing algorithm in `src/lib/pairing.ts`
- [ ] Artifact cards render with Figma thumbnail + PR info
- [ ] Heatmap renders with real data
- [ ] Filters + grouping work
- [ ] `npm run build` passes
- [ ] Committed: `feat: unified timeline — artifact cards, pairing, heatmap`
