import type { TimelineEventType } from './types'

const MINUTE = 60_000
const HOUR = 3_600_000
const DAY = 86_400_000
const WEEK = 604_800_000

export function relativeTime(dateString: string): string {
  const diff = Date.now() - new Date(dateString).getTime()

  if (diff < MINUTE) return 'just now'
  if (diff < HOUR) {
    const m = Math.floor(diff / MINUTE)
    return `${m}m ago`
  }
  if (diff < DAY) {
    const h = Math.floor(diff / HOUR)
    return `${h}h ago`
  }
  if (diff < WEEK) {
    const d = Math.floor(diff / DAY)
    return `${d}d ago`
  }

  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}

export const eventTypeConfig: Record<
  TimelineEventType,
  { label: string; dotClass: string }
> = {
  pr_merged: { label: 'PR Merged', dotClass: 'bg-ds-timeline-dot-pr' },
  commit: { label: 'Commit', dotClass: 'bg-ds-timeline-dot-commit' },
  deploy: { label: 'Deploy', dotClass: 'bg-ds-timeline-dot-deploy' },
  design: { label: 'Design', dotClass: 'bg-ds-timeline-dot-design' },
}
