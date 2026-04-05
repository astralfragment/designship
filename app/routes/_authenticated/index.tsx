import { useState, useCallback, useRef, useEffect, useMemo } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useQueryClient } from '@tanstack/react-query'
import { Timeline } from '../../components/timeline'
import type { TimelineEvent } from '../../components/timeline'
import { RepoSelector } from '../../components/repo-selector'
import { ViewToggle } from '../../components/view-toggle'
import { WeeklySummaryDialog } from '../../components/weekly-summary-dialog'
import { ErrorBoundary } from '../../components/error-boundary'
import { useToast } from '../../components/toast'
import { useRepos, useMergedPRsPaginated } from '@/hooks/use-github'
import { useAiRewrite } from '@/hooks/use-ai-rewrite'
import { useAiClassify } from '@/hooks/use-ai-classify'
import { useWeeklySummary } from '@/hooks/use-weekly-summary'
import { useSaveSummary } from '@/hooks/use-summaries'
import { useFigmaScreenshots } from '@/hooks/use-figma'
import { useAuth } from '@/lib/auth'
import type { ViewMode } from '@/lib/ai'
import type { GitHubRepo, GitHubPR } from '@/lib/github'
import { Button } from '@/components/ui/button'
import { RefreshCwIcon, LoaderCircleIcon, FileTextIcon, AlertTriangleIcon, LogOutIcon } from 'lucide-react'
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
  const { githubToken, signOut } = useAuth()
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const { data: repos, isLoading: reposLoading, error: reposError } = useRepos()

  const [selectedRepo, setSelectedRepo] = useState<GitHubRepo | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('builder')

  // Sync view mode from localStorage after hydration
  useEffect(() => {
    const stored = localStorage.getItem('ds-view-mode')
    if (stored === 'stakeholder') setViewMode('stakeholder')
  }, [])

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
    error: prsError,
  } = useMergedPRsPaginated(owner ?? '', repo ?? '')

  const events: TimelineEvent[] = useMemo(
    () => prPages?.pages.flatMap((page) => page.prs.map(prToTimelineEvent)) ?? [],
    [prPages],
  )

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

  // Figma screenshot extraction from PR descriptions
  const figmaData = useFigmaScreenshots(events)

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
  const saveInitiated = useRef(false)
  const summaryRepoRef = useRef<string | undefined>(undefined)

  // Auto-save summary to Supabase when generated
  const saveMutate = saveSummaryMutation.mutate
  const isSaving = saveSummaryMutation.isPending
  useEffect(() => {
    if (summary && !summaryGenerating && !summarySaved && !isSaving && !saveInitiated.current) {
      saveInitiated.current = true
      const repoName = summaryRepoRef.current
      saveMutate(
        { summary, repoName },
        {
          onSuccess: () => setSummarySaved(true),
          onError: () => { saveInitiated.current = false },
        },
      )
    }
  }, [summary, summaryGenerating, summarySaved, isSaving, saveMutate])

  const handleGenerateSummary = useCallback(() => {
    setSummaryOpen(true)
    setSummarySaved(false)
    saveInitiated.current = false
    summaryRepoRef.current = activeRepo?.full_name
    generateSummary()
  }, [generateSummary, activeRepo?.full_name])

  const handleSummaryOpenChange = useCallback(
    (open: boolean) => {
      setSummaryOpen(open)
      if (!open) {
        resetSummary()
        saveInitiated.current = false
      }
    },
    [resetSummary],
  )

  // Show toast on rate limit / fetch errors
  useEffect(() => {
    if (reposError) {
      const msg = reposError instanceof Error ? reposError.message : 'Failed to load repos'
      toast(msg, 'error', 5000)
    }
  }, [reposError, toast])

  useEffect(() => {
    if (prsError) {
      const msg = prsError instanceof Error ? prsError.message : 'Failed to load activity'
      toast(msg, 'error', 5000)
    }
  }, [prsError, toast])

  // Persist view mode preference
  useEffect(() => {
    localStorage.setItem('ds-view-mode', viewMode)
  }, [viewMode])

  const missingGithubToken = !githubToken
  const loading = reposLoading || (!!activeRepo && prsLoading)

  // Pull-to-refresh state
  const [pullDistance, setPullDistance] = useState(0)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const touchStartY = useRef(0)
  const containerRef = useRef<HTMLDivElement>(null)

  const PULL_THRESHOLD = 80

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true)
    try {
      await queryClient.invalidateQueries({
        queryKey: ['github', 'prs-paginated', owner, repo],
      })
    } finally {
      setIsRefreshing(false)
    }
  }, [queryClient, owner, repo])

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0]
    if (touch) {
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
      <div className="mb-8 space-y-4">
        <div className="flex items-start justify-between gap-4">
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
          <div className="hidden items-center gap-2 sm:flex">
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
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {(aiFetching || classifyFetching) && (
            <LoaderCircleIcon className="size-3.5 animate-spin text-ds-text-tertiary sm:hidden" />
          )}
          <ViewToggle mode={viewMode} onChange={setViewMode} />
          <RepoSelector
            repos={repos ?? []}
            selectedRepo={activeRepo}
            onSelect={setSelectedRepo}
            loading={reposLoading}
          />
          <Button
            variant="outline"
            size="sm"
            onClick={handleGenerateSummary}
            disabled={loading || events.length === 0 || summaryGenerating}
            className="gap-1.5 text-xs sm:hidden"
          >
            <FileTextIcon className="size-3.5" />
            Summary
          </Button>
        </div>
      </div>

      {/* Timeline */}
      <div
        key={viewMode}
        className="animate-ds-fade-in"
      >
        {missingGithubToken ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-16">
            <AlertTriangleIcon className="mb-3 size-8 text-ds-text-tertiary" />
            <p className="text-sm font-medium text-ds-text-primary">
              GitHub connection lost
            </p>
            <p className="mt-1 max-w-sm text-center text-xs text-ds-text-tertiary">
              Your GitHub token has expired or been revoked. Please sign out and sign in again to reconnect.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => signOut()}
              className="mt-4 gap-1.5"
            >
              <LogOutIcon className="size-3.5" />
              Sign out &amp; reconnect
            </Button>
          </div>
        ) : prsError && !prsLoading ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-destructive/40 py-16">
            <AlertTriangleIcon className="mb-3 size-8 text-destructive/60" />
            <p className="text-sm font-medium text-destructive">
              {prsError?.name === 'GitHubRateLimitError'
                ? 'GitHub rate limit reached'
                : 'Failed to load activity'}
            </p>
            <p className="mt-1 max-w-sm text-center text-xs text-ds-text-tertiary">
              {prsError instanceof Error ? prsError.message : 'Please try again later.'}
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleRefresh()}
              className="mt-4 gap-1.5"
            >
              <RefreshCwIcon className="size-3.5" />
              Retry
            </Button>
          </div>
        ) : (
          <ErrorBoundary>
            <Timeline
              events={events}
              loading={loading}
              hasMore={!!hasNextPage}
              loadingMore={isFetchingNextPage}
              onLoadMore={() => fetchNextPage()}
              rewrittenDescriptions={rewrittenDescriptions}
              viewMode={viewMode}
              categories={categories}
              figmaData={figmaData}
            />
          </ErrorBoundary>
        )}
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
