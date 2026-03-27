# PRD 02 — Today View

## Goal
Build the `/today` route — what you did today, todos, and a pulse comparison against yesterday / last week / your average.

## Visual Direction
- Asymmetric two-column layout: left = today's work feed, right = pulse/compare + todos
- Cards for each PR/Figma item — clean, airy, NOT cramped
- Pulse numbers: large, bold, Playfair Display
- Todo list: minimal, inline checkbox style
- Color: dusty rose accents on active/complete items

## Route
`src/routes/today/index.tsx`

## Components to build

### `src/components/today/today-feed.tsx`
- Fetches today's PRs (merged_at = today) + Figma frames (last_modified = today) from Supabase
- Uses TanStack Query: `useQuery(['today-work'])`
- Shows empty state: "Nothing shipped yet today — the day is yours" with a small sparkle icon
- Each item: artifact card (mini version) — icon + title + repo/file + time

### `src/components/today/pulse-compare.tsx`
- Three metrics side by side:
  1. **vs Yesterday** — today's item count vs yesterday's
  2. **vs Last Week** — same weekday last week
  3. **vs Your Average** — today vs rolling 4-week weekday average
- Each metric: number (big), label (small), trend arrow (↑ green / ↓ muted rose / → neutral)
- Data from Supabase queries aggregating github_prs + figma_frames

### `src/components/today/todo-list.tsx`
- Load todos from Supabase (user's todos where done=false)
- Add todo: inline input, press Enter to save
- Check off: optimistic update → mark done in DB
- Auto-surface: show open GitHub PRs (not merged) as suggested todos with a "+" to add
- Max 10 visible, scroll for more

## Data queries (TanStack Query)
```typescript
// today's work
const today = new Date(); today.setHours(0,0,0,0);
supabase.from('github_prs').select('*').eq('user_id', userId).gte('merged_at', today.toISOString())
supabase.from('figma_frames').select('*').eq('user_id', userId).gte('last_modified', today.toISOString())

// pulse compare - yesterday
const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
// ... similar queries for each comparison period
```

## Done when
- [ ] `/today` route renders
- [ ] Today feed shows real data from Supabase
- [ ] Pulse compare shows all 3 metrics
- [ ] Todos load, add, and check off
- [ ] Empty states handled
- [ ] `npm run build` passes
- [ ] Committed: `feat: today view — feed, pulse compare, todos`
