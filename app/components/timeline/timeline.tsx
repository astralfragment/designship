import { useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { LoaderCircleIcon, FolderIcon } from 'lucide-react'
import type { ViewMode } from '@/lib/ai'
import type { TimelineEvent } from './types'
import type { EventFigmaData } from '@/hooks/use-figma'
import { TimelineEntry } from './timeline-entry'
import { TimelineSkeleton } from './timeline-skeleton'
import { TimelineEmpty } from './timeline-empty'

interface TimelineProps {
  events: TimelineEvent[]
  loading?: boolean
  hasMore?: boolean
  loadingMore?: boolean
  onLoadMore?: () => void
  rewrittenDescriptions?: Record<string, string>
  viewMode: ViewMode
  categories?: Record<string, string>
  figmaData?: Map<string, EventFigmaData>
}

export function Timeline({
  events,
  loading,
  hasMore,
  loadingMore,
  onLoadMore,
  rewrittenDescriptions,
  viewMode,
  categories,
  figmaData,
}: TimelineProps) {
  if (loading) {
    return <TimelineSkeleton />
  }

  if (events.length === 0) {
    return <TimelineEmpty />
  }

  const isStakeholder = viewMode === 'stakeholder'

  if (isStakeholder && categories && Object.keys(categories).length > 0) {
    return (
      <StakeholderTimeline
        events={events}
        categories={categories}
        rewrittenDescriptions={rewrittenDescriptions}
        hasMore={hasMore}
        loadingMore={loadingMore}
        onLoadMore={onLoadMore}
        figmaData={figmaData}
      />
    )
  }

  return (
    <div role="feed" aria-label="Activity timeline" className="animate-ds-fade-in">
      {events.map((event, i) => (
        <TimelineEntry
          key={event.id}
          event={event}
          isLast={i === events.length - 1 && !hasMore}
          rewrittenDescription={rewrittenDescriptions?.[event.id]}
          viewMode={viewMode}
          figmaLinks={figmaData?.get(event.id)?.links}
        />
      ))}

      <LoadMoreButton
        hasMore={hasMore}
        loadingMore={loadingMore}
        onLoadMore={onLoadMore}
      />
    </div>
  )
}

function StakeholderTimeline({
  events,
  categories,
  rewrittenDescriptions,
  hasMore,
  loadingMore,
  onLoadMore,
  figmaData,
}: {
  events: TimelineEvent[]
  categories: Record<string, string>
  rewrittenDescriptions?: Record<string, string>
  hasMore?: boolean
  loadingMore?: boolean
  onLoadMore?: () => void
  figmaData?: Map<string, EventFigmaData>
}) {
  const grouped = useMemo(() => {
    const groups: Record<string, TimelineEvent[]> = {}
    for (const event of events) {
      const category = categories[event.id] ?? 'Other Updates'
      if (!groups[category]) groups[category] = []
      groups[category]!.push(event)
    }
    // Sort groups by number of entries (largest first)
    return Object.entries(groups).sort((a, b) => b[1].length - a[1].length)
  }, [events, categories])

  return (
    <div role="feed" aria-label="Activity timeline — stakeholder view" className="animate-ds-fade-in space-y-6">
      {grouped.map(([category, groupEvents]) => (
        <div key={category}>
          <div className="mb-3 flex items-center gap-2">
            <FolderIcon className="size-3.5 text-ds-text-tertiary" />
            <h2 className="text-xs font-semibold uppercase tracking-wider text-ds-text-secondary">
              {category}
            </h2>
            <span className="text-[10px] text-ds-text-tertiary">
              {groupEvents.length} {groupEvents.length === 1 ? 'update' : 'updates'}
            </span>
          </div>
          {groupEvents.map((event, i) => (
            <TimelineEntry
              key={event.id}
              event={event}
              isLast={i === groupEvents.length - 1}
              rewrittenDescription={rewrittenDescriptions?.[event.id]}
              viewMode="stakeholder"
              figmaLinks={figmaData?.get(event.id)?.links}
            />
          ))}
        </div>
      ))}

      <LoadMoreButton
        hasMore={hasMore}
        loadingMore={loadingMore}
        onLoadMore={onLoadMore}
      />
    </div>
  )
}

function LoadMoreButton({
  hasMore,
  loadingMore,
  onLoadMore,
}: {
  hasMore?: boolean
  loadingMore?: boolean
  onLoadMore?: () => void
}) {
  if (!hasMore || !onLoadMore) return null

  return (
    <div className="flex justify-center py-4">
      <Button
        variant="ghost"
        size="sm"
        onClick={onLoadMore}
        disabled={loadingMore}
        className="gap-2 text-ds-text-secondary"
      >
        {loadingMore && (
          <LoaderCircleIcon className="size-3.5 animate-spin" />
        )}
        {loadingMore ? 'Loading...' : 'Load more'}
      </Button>
    </div>
  )
}
