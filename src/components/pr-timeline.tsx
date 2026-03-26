import { useQuery } from '@tanstack/react-query'
import { fetchMergedPRs } from '@/lib/github'
import { rewriteForStakeholder, type MergedPR } from '@/lib/rewrite'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { GitPullRequest, GitBranch, GitCommit, ExternalLink } from 'lucide-react'
import { useState } from 'react'

type ViewMode = 'builder' | 'stakeholder'
type TimeRange = 7 | 14 | 30

export function PRTimeline() {
  const [days, setDays] = useState<TimeRange>(7)
  const [view, setView] = useState<ViewMode>('builder')

  const { data: prs, isLoading, error } = useQuery({
    queryKey: ['prs', days],
    queryFn: () => fetchMergedPRs(days),
  })

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <GitPullRequest className="w-4 h-4 text-primary" />
          <h2
            className="text-xl font-semibold"
            style={{ fontFamily: '"Playfair Display", serif' }}
          >
            PR Timeline
          </h2>
        </div>

        <div className="flex items-center gap-3">
          <Tabs value={view} onValueChange={(v) => setView(v as ViewMode)}>
            <TabsList className="h-8">
              <TabsTrigger value="builder" className="text-xs px-3 h-7">Builder</TabsTrigger>
              <TabsTrigger value="stakeholder" className="text-xs px-3 h-7">Stakeholder</TabsTrigger>
            </TabsList>
          </Tabs>

          <Tabs value={String(days)} onValueChange={(v) => setDays(Number(v) as TimeRange)}>
            <TabsList className="h-8">
              <TabsTrigger value="7" className="text-xs px-2 h-7">7d</TabsTrigger>
              <TabsTrigger value="14" className="text-xs px-2 h-7">14d</TabsTrigger>
              <TabsTrigger value="30" className="text-xs px-2 h-7">30d</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i} className="border-border/50 bg-card/50">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Skeleton className="w-8 h-8 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {error && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="p-4 text-sm text-destructive">
            Failed to load pull requests. Please try again.
          </CardContent>
        </Card>
      )}

      {prs && prs.length === 0 && (
        <Card className="border-border/50 bg-card/50">
          <CardContent className="p-8 text-center text-muted-foreground">
            No merged PRs found in the last {days} days.
          </CardContent>
        </Card>
      )}

      {prs && prs.length > 0 && (
        <div className="space-y-2">
          {prs.map((pr: MergedPR) => (
            <PRCard key={pr.id} pr={pr} view={view} />
          ))}
        </div>
      )}
    </div>
  )
}

function PRCard({ pr, view }: { pr: MergedPR; view: ViewMode }) {
  const displayTitle = view === 'stakeholder'
    ? rewriteForStakeholder(pr.title)
    : pr.title

  const mergedDate = new Date(pr.mergedAt)
  const dateStr = mergedDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })

  return (
    <Card className="border-border/50 bg-card/50 hover:border-primary/20 transition-colors group">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Avatar className="w-8 h-8 mt-0.5">
            <AvatarImage src={pr.authorAvatar} alt={pr.author} />
            <AvatarFallback className="text-xs">{pr.author[0]?.toUpperCase()}</AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <a
                  href={pr.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-foreground hover:text-primary transition-colors inline-flex items-center gap-1"
                >
                  <span className="truncate">{displayTitle}</span>
                  <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-50 flex-shrink-0" />
                </a>
              </div>
              <span className="text-xs text-muted-foreground whitespace-nowrap">{dateStr}</span>
            </div>

            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <Badge variant="secondary" className="text-xs font-mono h-5 px-1.5">
                {pr.repo}
              </Badge>

              {view === 'builder' && (
                <>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <GitBranch className="w-3 h-3" />
                    <span className="font-mono truncate max-w-[120px]">{pr.branch}</span>
                  </span>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <GitCommit className="w-3 h-3" />
                    {pr.commitCount}
                  </span>
                </>
              )}

              <span className="text-xs text-muted-foreground">by @{pr.author}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
