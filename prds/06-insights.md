# PRD 06 — Insights

## Goal
Show work velocity over time, personal baseline, and activity patterns.

## Route
`src/routes/insights/index.tsx`

## Charts (use Recharts)

### Weekly velocity chart
- Line or bar chart: PRs merged per week (last 12 weeks)
- Second line: Figma frames modified per week
- X axis: week label ("Mar 20", "Mar 27")
- Styled with dusty rose + slate colors, no default Recharts blue

### Activity breakdown (this month)
- Donut chart: Shipped / Fixed / Designed / Cleaned Up
- Derived from PR type prefixes + Figma-only items

### Personal baseline card
- "Your average week: X PRs, Y Figma frames"
- "Your busiest day: Thursday"
- "Your most active repo: [repo name]"
- Computed from all stored history

### Streak
- Current streak: N consecutive days with at least 1 PR or Figma update
- Best streak: N days

## Data queries
All from Supabase, grouped by week/day using SQL:
```sql
-- PRs per week
select date_trunc('week', merged_at) as week, count(*) 
from github_prs where user_id = $1 
group by week order by week desc limit 12;
```

## Done when
- [ ] Velocity chart renders with real data
- [ ] Activity breakdown donut works
- [ ] Personal baseline computed and shown
- [ ] Streak displayed
- [ ] `npm run build` passes
- [ ] Committed: `feat: insights — velocity charts, baseline, streaks`
