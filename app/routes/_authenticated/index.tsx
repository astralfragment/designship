import { useState, useCallback, useRef, useEffect } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { useQueryClient } from '@tanstack/react-query'
import { Timeline } from '../../components/timeline'
import type { TimelineEvent } from '../../components/timeline'
import { RepoSelector } from '../../components/repo-selector'
import { useRepos, useMergedPRsPaginated } from '@/hooks/use-github'
import { useAiRewrite } from '@/hooks/use-ai-rewrite'
import { useAuth } from '@/lib/auth'
import type { GitHubRepo, GitHubPR } from '@/lib/github'
import { RefreshCwIcon, BookOpenIcon, CodeIcon, LoaderCircleIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

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
  const [showPlainEnglish, setShowPlainEnglish] = useState(() => {
    if (typeof window === 'undefined') return false
    return localStorage.getItem('ds-view-mode') === 'plain'
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

  // AI rewriting
  const {
    data: rewrittenDescriptions,
    isLoading: aiLoading,
    isFetching: aiFetching,
  } = useAiRewrite(events, showPlainEnglish)

  // Persist view mode preference
  useEffect(() => {
    localStorage.setItem('ds-view-mode', showPlainEnglish ? 'plain' : 'technical')
  }, [showPlainEnglish])

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
            Your recent development activity at a glance.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowPlainEnglish((v) => !v)}
            className={cn(
              'gap-1.5 text-xs',
              showPlainEnglish && 'border-primary/50 bg-primary/5 text-primary',
            )}
          >
            {aiFetching ? (
              <LoaderCircleIcon className="size-3.5 animate-spin" />
            ) : showPlainEnglish ? (
              <BookOpenIcon className="size-3.5" />
            ) : (
              <CodeIcon className="size-3.5" />
            )}
            {showPlainEnglish ? 'Plain English' : 'Technical'}
          </Button>
          <RepoSelector
            repos={repos ?? []}
            selectedRepo={activeRepo}
            onSelect={setSelectedRepo}
            loading={reposLoading}
          />
        </div>
      </div>

      {/* Timeline */}
      <Timeline
        events={events}
        loading={loading}
        hasMore={!!hasNextPage}
        loadingMore={isFetchingNextPage}
        onLoadMore={() => fetchNextPage()}
        rewrittenDescriptions={rewrittenDescriptions}
        showPlainEnglish={showPlainEnglish}
      />
    </div>
  )
}
