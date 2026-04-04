import { Button } from '@/components/ui/button'
import { LoaderCircleIcon } from 'lucide-react'
import type { TimelineEvent } from './types'
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
  showPlainEnglish?: boolean
}

export function Timeline({
  events,
  loading,
  hasMore,
  loadingMore,
  onLoadMore,
  rewrittenDescriptions,
  showPlainEnglish,
}: TimelineProps) {
  if (loading) {
    return <TimelineSkeleton />
  }

  if (events.length === 0) {
    return <TimelineEmpty />
  }

  return (
    <div role="feed" aria-label="Activity timeline">
      {events.map((event, i) => (
        <TimelineEntry
          key={event.id}
          event={event}
          isLast={i === events.length - 1 && !hasMore}
          rewrittenDescription={rewrittenDescriptions?.[event.id]}
          showPlainEnglish={showPlainEnglish}
        />
      ))}

      {hasMore && onLoadMore && (
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
      )}
    </div>
  )
}
