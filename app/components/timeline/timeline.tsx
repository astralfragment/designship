import type { TimelineEvent } from './types'
import { TimelineEntry } from './timeline-entry'
import { TimelineSkeleton } from './timeline-skeleton'
import { TimelineEmpty } from './timeline-empty'

interface TimelineProps {
  events: TimelineEvent[]
  loading?: boolean
}

export function Timeline({ events, loading }: TimelineProps) {
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
          isLast={i === events.length - 1}
        />
      ))}
    </div>
  )
}
