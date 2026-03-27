import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { ArrowUp, ArrowDown, ArrowRight } from 'lucide-react'

function startOfDay(date: Date) {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

function endOfDay(date: Date) {
  const d = new Date(date)
  d.setHours(23, 59, 59, 999)
  return d
}

async function countItemsForDay(date: Date): Promise<number> {
  const start = startOfDay(date).toISOString()
  const end = endOfDay(date).toISOString()

  const [prs, frames] = await Promise.all([
    supabase
      .from('github_prs')
      .select('id', { count: 'exact', head: true })
      .gte('merged_at', start)
      .lte('merged_at', end),
    supabase
      .from('figma_frames')
      .select('id', { count: 'exact', head: true })
      .gte('last_modified', start)
      .lte('last_modified', end),
  ])

  return (prs.count ?? 0) + (frames.count ?? 0)
}

async function countItemsForDays(dates: Date[]): Promise<number> {
  const counts = await Promise.all(dates.map(countItemsForDay))
  return counts.reduce((sum, c) => sum + c, 0)
}

interface PulseData {
  today: number
  yesterday: number
  lastWeek: number
  avg: number
}

async function fetchPulse(): Promise<PulseData> {
  const now = new Date()
  const today = startOfDay(now)

  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  const sameWeekdayLastWeek = new Date(today)
  sameWeekdayLastWeek.setDate(sameWeekdayLastWeek.getDate() - 7)

  // Rolling 4-week same-weekday average
  const avgDays: Date[] = []
  for (let w = 1; w <= 4; w++) {
    const d = new Date(today)
    d.setDate(d.getDate() - 7 * w)
    avgDays.push(d)
  }

  const [todayCount, yesterdayCount, lastWeekCount, avgTotal] =
    await Promise.all([
      countItemsForDay(now),
      countItemsForDay(yesterday),
      countItemsForDay(sameWeekdayLastWeek),
      countItemsForDays(avgDays),
    ])

  return {
    today: todayCount,
    yesterday: yesterdayCount,
    lastWeek: lastWeekCount,
    avg: avgDays.length > 0 ? Math.round(avgTotal / avgDays.length) : 0,
  }
}

function TrendArrow({ current, compare }: { current: number; compare: number }) {
  if (current > compare) {
    return <ArrowUp className="w-4 h-4 text-emerald-400" />
  }
  if (current < compare) {
    return <ArrowDown className="w-4 h-4 text-primary/60" />
  }
  return <ArrowRight className="w-4 h-4 text-muted-foreground" />
}

function MetricCard({
  label,
  current,
  compare,
}: {
  label: string
  current: number
  compare: number
}) {
  const diff = current - compare
  const sign = diff > 0 ? '+' : ''

  return (
    <div className="flex flex-col items-center gap-1 flex-1">
      <div className="flex items-center gap-1">
        <span
          className="text-3xl font-bold text-foreground"
          style={{ fontFamily: '"Playfair Display", serif' }}
        >
          {current}
        </span>
        <TrendArrow current={current} compare={compare} />
      </div>
      <span className="text-xs text-muted-foreground">
        {sign}{diff} {label}
      </span>
    </div>
  )
}

export function PulseCompare() {
  const { data, isLoading } = useQuery({
    queryKey: ['pulse-compare'],
    queryFn: fetchPulse,
  })

  return (
    <Card className="border-border/50 bg-card/50">
      <CardHeader className="pb-3">
        <CardTitle
          className="text-base font-semibold"
          style={{ fontFamily: '"Playfair Display", serif' }}
        >
          Pulse
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2">
                <Skeleton className="h-8 w-12" />
                <Skeleton className="h-3 w-16" />
              </div>
            ))}
          </div>
        ) : data ? (
          <div className="flex gap-4">
            <MetricCard
              label="vs yesterday"
              current={data.today}
              compare={data.yesterday}
            />
            <MetricCard
              label="vs last week"
              current={data.today}
              compare={data.lastWeek}
            />
            <MetricCard
              label="vs average"
              current={data.today}
              compare={data.avg}
            />
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
