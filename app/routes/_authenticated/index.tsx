import { useState, useCallback, useRef, useEffect } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useQueryClient } from '@tanstack/react-query'
import { Timeline } from '../../components/timeline'
import type { TimelineEvent } from '../../components/timeline'
import { RepoSelector } from '../../components/repo-selector'
import { ViewToggle } from '../../components/view-toggle'
import { WeeklySummaryDialog } from '../../components/weekly-summary-dialog'
import { useRepos, useMergedPRsPaginated } from '@/hooks/use-github'
import { useAiRewrite } from '@/hooks/use-ai-rewrite'
import { useAiClassify } from '@/hooks/use-ai-classify'
import { useWeeklySummary } from '@/hooks/use-weekly-summary'
import { useSaveSummary } from '@/hooks/use-summaries'
import { useAuth } from '@/lib/auth'
import type { ViewMode } from '@/lib/ai'
import type { GitHubRepo, GitHubPR } from '@/lib/github'
import { Button } from '@/components/ui/button'
import { RefreshCwIcon, LoaderCircleIcon, FileTextIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/_authenticated/')({
  component: HomePage,
})

function prToTimelineEvent(pr: GitHubPR): TimelineEvent {
  return {
    id: `pr-${pr.id}`,
    type: 'pr_merged',
    title: pr.title,
    description: pr.body,
    timestamp: pr.merged_at ?? pr.updated_at,
    url: pr.html_url,
    author: {
      name: pr.user.login,
      avatarUrl: pr.user.avatar_url,
    },
    metadata: {
      type: 'pr_merged',
      number: pr.number,
      branch: pr.head.ref,
      baseBranch: pr.base.ref,
      reviewCount: pr.review_comments,
      filesChanged: pr.changed_files,
      additions: pr.additions,
      deletions: pr.deletions,
      labels: pr.labels,
    },
  }
}

function HomePage() {
  const { githubToken } = useAuth()
  const queryClient = useQueryClient()
  const { data: repos, isLoading: reposLoading } = useRepos()

  const [selectedRepo, setSelectedRepo] = useState<GitHubRepo | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    if (typeof window === 'undefined') return 'builder'
    return (localStorage.getItem('ds-view-mode') as ViewMode) === 'stakeholder'
      ? 'stakeholder'
      : 'builder'
  })

  // Default to first repo if none selected
  const activeRepo = selectedRepo ?? repos?.[0] ?? null
  const [owner, repo] = activeRepo?.full_name.split('/') ?? []

  const {
    data: prPages,
    isLoading: prsLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    isRefetching,
  } = useMergedPRsPaginated(owner ?? '', repo ?? '')

  const events: TimelineEvent[] =
    prPages?.pages.flatMap((page) => page.prs.map(prToTimelineEvent)) ?? []

  const isStakeholder = viewMode === 'stakeholder'

  // AI rewriting (active in stakeholder mode)
  const {
    data: rewrittenDescriptions,
    isFetching: aiFetching,
  } = useAiRewrite(events, isStakeholder)

  // AI classification for feature grouping (active in stakeholder mode)
  const {
    data: categories,
    isFetching: classifyFetching,
  } = useAiClassify(events, isStakeholder)

  // Weekly summary generation + persistence
  const {
    summary,
    isGenerating: summaryGenerating,
    error: summaryError,
    generate: generateSummary,
    reset: resetSummary,
  } = useWeeklySummary(events)
  const saveSummaryMutation = useSaveSummary()
  const [summaryOpen, setSummaryOpen] = useState(false)
  const [summarySaved, setSummarySaved] = useState(false)

  // Auto-save summary to Supabase when generated
  useEffect(() => {
    if (summary && !summaryGenerating && !summarySaved) {
      const repoName = activeRepo?.full_name
      saveSummaryMutation.mutate(
        { summary, repoName },
        { onSuccess: () => setSummarySaved(true) },
      )
    }
  }, [summary, summaryGenerating, summarySaved, activeRepo?.full_name, saveSummaryMutation])

  const handleGenerateSummary = useCallback(() => {
    setSummaryOpen(true)
    setSummarySaved(false)
    generateSummary()
  }, [generateSummary])

  const handleSummaryOpenChange = useCallback(
    (open: boolean) => {
      setSummaryOpen(open)
      if (!open) resetSummary()
    },
    [resetSummary],
  )

  // Persist view mode preference
  useEffect(() => {
    localStorage.setItem('ds-view-mode', viewMode)
  }, [viewMode])

  const loading = !githubToken || reposLoading || prsLoading

  // Pull-to-refresh state
  const [pullDistance, setPullDistance] = useState(0)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const touchStartY = useRef(0)
  const containerRef = useRef<HTMLDivElement>(null)

  const PULL_THRESHOLD = 80

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true)
    await queryClient.invalidateQueries({
      queryKey: ['github', 'prs-paginated', owner, repo],
    })
    setIsRefreshing(false)
  }, [queryClient, owner, repo])

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    const scrollTop = containerRef.current?.scrollTop ?? window.scrollY
    const touch = e.touches[0]
    if (scrollTop <= 0 && touch) {
      touchStartY.current = touch.clientY
    }
  }, [])

  const onTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (isRefreshing) return
      const scrollTop = containerRef.current?.scrollTop ?? window.scrollY
      if (scrollTop > 0) {
        setPullDistance(0)
        return
      }
      const touch = e.touches[0]
      if (!touch) return
      const deltaY = touch.clientY - touchStartY.current
      if (deltaY > 0) {
        setPullDistance(Math.min(deltaY * 0.4, 120))
      }
    },
    [isRefreshing],
  )

  const onTouchEnd = useCallback(() => {
    if (pullDistance >= PULL_THRESHOLD && !isRefreshing) {
      handleRefresh()
    }
    setPullDistance(0)
  }, [pullDistance, isRefreshing, handleRefresh])

  const refreshing = isRefreshing || isRefetching

  return (
    <div
      ref={containerRef}
      className="mx-auto max-w-3xl px-4 py-8 sm:px-6"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Pull-to-refresh indicator */}
      <div
        className={cn(
          'flex items-center justify-center overflow-hidden transition-[height] duration-200',
          pullDistance > 0 || refreshing ? 'mb-4' : '',
        )}
        style={{ height: refreshing ? 32 : pullDistance > 0 ? pullDistance * 0.3 : 0 }}
      >
        <RefreshCwIcon
          className={cn(
            'size-4 text-ds-text-tertiary transition-transform',
            refreshing && 'animate-spin',
            pullDistance >= PULL_THRESHOLD && 'text-primary',
          )}
          style={{
            transform: refreshing
              ? undefined
              : `rotate(${(pullDistance / PULL_THRESHOLD) * 360}deg)`,
          }}
        />
      </div>

      {/* Header */}
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ds-text-primary">
            Timeline
          </h1>
          <p className="mt-1 text-sm text-ds-text-secondary">
            {isStakeholder
              ? 'What your team shipped, in plain English.'
              : 'Your recent development activity at a glance.'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {(aiFetching || classifyFetching) && (
            <LoaderCircleIcon className="size-3.5 animate-spin text-ds-text-tertiary" />
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handleGenerateSummary}
            disabled={loading || events.length === 0 || summaryGenerating}
            className="gap-1.5 text-xs"
          >
            <FileTextIcon className="size-3.5" />
            Weekly Summary
          </Button>
          <ViewToggle mode={viewMode} onChange={setViewMode} />
          <RepoSelector
            repos={repos ?? []}
            selectedRepo={activeRepo}
            onSelect={setSelectedRepo}
            loading={reposLoading}
          />
        </div>
      </div>

      {/* Timeline */}
      <div
        key={viewMode}
        className="animate-ds-fade-in"
      >
        <Timeline
          events={events}
          loading={loading}
          hasMore={!!hasNextPage}
          loadingMore={isFetchingNextPage}
          onLoadMore={() => fetchNextPage()}
          rewrittenDescriptions={rewrittenDescriptions}
          viewMode={viewMode}
          categories={categories}
        />
      </div>

      {/* Weekly Summary Dialog */}
      <WeeklySummaryDialog
        open={summaryOpen}
        onOpenChange={handleSummaryOpenChange}
        summary={summary}
        isGenerating={summaryGenerating}
        error={summaryError}
      />
    </div>
  )
}
