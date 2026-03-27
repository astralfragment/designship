import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { GitPullRequest, Figma, Sparkles } from 'lucide-react'

interface WorkItem {
  id: string
  type: 'pr' | 'figma'
  title: string
  subtitle: string
  time: string
}

function startOfToday() {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d.toISOString()
}

async function fetchTodayWork(): Promise<WorkItem[]> {
  const todayISO = startOfToday()

  const [prsRes, framesRes] = await Promise.all([
    supabase
      .from('github_prs')
      .select('id, title, repo, merged_at')
      .gte('merged_at', todayISO)
      .order('merged_at', { ascending: false }),
    supabase
      .from('figma_frames')
      .select('id, frame_name, file_name, last_modified')
      .gte('last_modified', todayISO)
      .order('last_modified', { ascending: false }),
  ])

  const items: WorkItem[] = []

  for (const pr of prsRes.data ?? []) {
    items.push({
      id: pr.id,
      type: 'pr',
      title: pr.title,
      subtitle: pr.repo,
      time: new Date(pr.merged_at).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
      }),
    })
  }

  for (const frame of framesRes.data ?? []) {
    items.push({
      id: frame.id,
      type: 'figma',
      title: frame.frame_name,
      subtitle: frame.file_name,
      time: new Date(frame.last_modified).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
      }),
    })
  }

  items.sort((a, b) => {
    // Most recent first — already sorted from DB but we merged two lists
    return b.time.localeCompare(a.time)
  })

  return items
}

export function TodayFeed() {
  const { data: items, isLoading } = useQuery({
    queryKey: ['today-work'],
    queryFn: fetchTodayWork,
  })

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="border-border/50 bg-card/50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Skeleton className="w-8 h-8 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (!items || items.length === 0) {
    return (
      <Card className="border-border/50 bg-card/50">
        <CardContent className="p-10 text-center">
          <Sparkles className="w-8 h-8 text-primary/60 mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">
            Nothing shipped yet today — the day is yours
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-2">
      {items.map((item) => (
        <Card
          key={item.id}
          className="border-border/50 bg-card/50 hover:border-primary/20 transition-colors"
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
                {item.type === 'pr' ? (
                  <GitPullRequest className="w-4 h-4 text-primary" />
                ) : (
                  <Figma className="w-4 h-4 text-primary" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">
                  {item.title}
                </p>
                <p className="text-xs text-muted-foreground font-mono truncate">
                  {item.subtitle}
                </p>
              </div>
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                {item.time}
              </span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
