import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
  GitMergeIcon,
  GitCommitVerticalIcon,
  RocketIcon,
  PencilRulerIcon,
  ChevronDownIcon,
  ExternalLinkIcon,
  FilesIcon,
  PlusIcon,
  MinusIcon,
  MessageSquareIcon,
} from 'lucide-react'
import type { TimelineEvent, TimelineEventType } from './types'
import { relativeTime, eventTypeConfig } from './utils'

const eventIcons: Record<TimelineEventType, React.ElementType> = {
  pr_merged: GitMergeIcon,
  commit: GitCommitVerticalIcon,
  deploy: RocketIcon,
  design: PencilRulerIcon,
}

export function TimelineEntry({
  event,
  isLast,
  rewrittenDescription,
  showPlainEnglish,
}: {
  event: TimelineEvent
  isLast: boolean
  rewrittenDescription?: string
  showPlainEnglish?: boolean
}) {
  const [expanded, setExpanded] = useState(false)
  const config = eventTypeConfig[event.type]
  const Icon = eventIcons[event.type]

  return (
    <div className="group relative flex gap-4 animate-ds-slide-up">
      {/* Left rail: dot + connector */}
      <div className="flex flex-col items-center">
        <div
          className={cn(
            'relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full',
            config.dotClass,
          )}
        >
          <Icon className="size-4 text-white" />
        </div>
        {!isLast && (
          <div className="w-px flex-1 bg-ds-timeline-connector" />
        )}
      </div>

      {/* Content card */}
      <div className="mb-6 flex-1 pb-2">
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className={cn(
            'w-full rounded-lg border border-border/40 bg-card p-4 text-left transition-colors',
            'hover:border-border/70 hover:bg-card/80',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
          )}
        >
          {/* Header row */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-[10px] font-medium uppercase tracking-wider">
                  {config.label}
                </Badge>
                <span className="text-xs text-ds-text-tertiary">
                  {relativeTime(event.timestamp)}
                </span>
              </div>
              <h3 className="text-sm font-medium leading-snug text-ds-text-primary">
                {event.title}
              </h3>
            </div>
            <ChevronDownIcon
              className={cn(
                'size-4 shrink-0 text-ds-text-tertiary transition-transform duration-200',
                expanded && 'rotate-180',
              )}
            />
          </div>

          {/* Author + description preview */}
          <div className="mt-3 flex items-center gap-2">
            <Avatar size="sm">
              {event.author.avatarUrl && (
                <AvatarImage src={event.author.avatarUrl} alt={event.author.name} />
              )}
              <AvatarFallback>
                {event.author.name.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="text-xs text-ds-text-secondary">
              {event.author.name}
            </span>
          </div>

          {/* Metadata badges */}
          <EntryMetaBadges event={event} />

          {/* Expanded detail */}
          {expanded && (
            <EntryDetail
              event={event}
              rewrittenDescription={rewrittenDescription}
              showPlainEnglish={showPlainEnglish}
            />
          )}
        </button>
      </div>
    </div>
  )
}

function EntryMetaBadges({ event }: { event: TimelineEvent }) {
  const meta = event.metadata

  if (meta.type === 'pr_merged') {
    return (
      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <Badge variant="outline" className="gap-1 text-[10px]">
          {meta.branch}
        </Badge>
        {meta.reviewCount > 0 && (
          <Badge variant="outline" className="gap-1 text-[10px]">
            <MessageSquareIcon className="size-2.5" />
            {meta.reviewCount}
          </Badge>
        )}
        <Badge variant="outline" className="gap-1 text-[10px]">
          <FilesIcon className="size-2.5" />
          {meta.filesChanged} files
        </Badge>
        {meta.labels.map((label) => (
          <Badge
            key={label.name}
            variant="secondary"
            className="text-[10px]"
            style={{
              backgroundColor: `#${label.color}20`,
              color: `#${label.color}`,
              borderColor: `#${label.color}40`,
            }}
          >
            {label.name}
          </Badge>
        ))}
      </div>
    )
  }

  if (meta.type === 'commit') {
    return (
      <div className="mt-3 flex items-center gap-1.5">
        <Badge variant="outline" className="font-mono text-[10px]">
          {meta.sha.slice(0, 7)}
        </Badge>
        {meta.additions != null && (
          <Badge variant="outline" className="gap-1 text-[10px] text-ds-success">
            <PlusIcon className="size-2.5" />
            {meta.additions}
          </Badge>
        )}
        {meta.deletions != null && (
          <Badge variant="outline" className="gap-1 text-[10px] text-destructive">
            <MinusIcon className="size-2.5" />
            {meta.deletions}
          </Badge>
        )}
      </div>
    )
  }

  if (meta.type === 'deploy') {
    return (
      <div className="mt-3 flex items-center gap-1.5">
        <Badge
          variant={meta.status === 'success' ? 'secondary' : 'destructive'}
          className="text-[10px]"
        >
          {meta.environment} &middot; {meta.status}
        </Badge>
      </div>
    )
  }

  return null
}

function EntryDetail({
  event,
  rewrittenDescription,
  showPlainEnglish,
}: {
  event: TimelineEvent
  rewrittenDescription?: string
  showPlainEnglish?: boolean
}) {
  return (
    <div
      className="mt-4 animate-ds-slide-down space-y-3 border-t border-border/40 pt-4"
      onClick={(e) => e.stopPropagation()}
    >
      {(event.description || rewrittenDescription) && (
        <p className="text-xs leading-relaxed text-ds-text-secondary whitespace-pre-wrap">
          {showPlainEnglish && rewrittenDescription
            ? rewrittenDescription
            : event.description}
        </p>
      )}

      {event.metadata.type === 'pr_merged' && (
        <div className="flex items-center gap-4 text-xs text-ds-text-tertiary">
          <span className="flex items-center gap-1">
            <PlusIcon className="size-3 text-ds-success" />
            {event.metadata.additions} additions
          </span>
          <span className="flex items-center gap-1">
            <MinusIcon className="size-3 text-destructive" />
            {event.metadata.deletions} deletions
          </span>
        </div>
      )}

      {event.url && (
        <a
          href={event.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          View on GitHub
          <ExternalLinkIcon className="size-3" />
        </a>
      )}
    </div>
  )
}
