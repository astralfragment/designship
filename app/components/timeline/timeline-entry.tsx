import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
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
import type { ViewMode } from '@/lib/ai'
import type { TimelineEvent, TimelineEventType } from './types'
import type { FigmaLinkWithScreenshot } from '@/hooks/use-figma'
import { useIsMobile } from '@/hooks/use-mobile'
import { relativeTime, eventTypeConfig } from './utils'
import { FigmaThumbnails } from './figma-preview'

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
  viewMode = 'builder',
  figmaLinks,
}: {
  event: TimelineEvent
  isLast: boolean
  rewrittenDescription?: string
  viewMode?: ViewMode
  figmaLinks?: FigmaLinkWithScreenshot[]
}) {
  const [expanded, setExpanded] = useState(false)
  const isMobile = useIsMobile()
  const config = eventTypeConfig[event.type]
  const Icon = eventIcons[event.type]
  const isStakeholder = viewMode === 'stakeholder'

  const handleToggle = () => {
    setExpanded((v) => !v)
  }

  return (
    <div className="group relative flex gap-3 animate-ds-slide-up sm:gap-4">
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
      <div className="mb-6 min-w-0 flex-1 pb-2">
        <button
          type="button"
          onClick={handleToggle}
          aria-expanded={expanded}
          className={cn(
            'w-full min-h-[44px] rounded-lg border border-border/40 bg-card p-3 text-left transition-colors sm:p-4',
            'hover:border-border/70 hover:bg-card/80',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
          )}
        >
          {/* Header row */}
          <div className="flex items-start justify-between gap-2 sm:gap-3">
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                {!isStakeholder && (
                  <Badge variant="secondary" className="text-[10px] font-medium uppercase tracking-wider">
                    {config.label}
                  </Badge>
                )}
                <span className="text-xs text-ds-text-tertiary">
                  {relativeTime(event.timestamp)}
                </span>
              </div>
              <h3 className="text-sm font-medium leading-snug text-ds-text-primary">
                {isStakeholder && rewrittenDescription && !event.description
                  ? rewrittenDescription
                  : event.title}
              </h3>
            </div>
            <ChevronDownIcon
              className={cn(
                'size-4 shrink-0 text-ds-text-tertiary transition-transform duration-200',
                expanded && 'rotate-180',
              )}
            />
          </div>

          {/* Author */}
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

          {/* Metadata badges — hidden in Stakeholder view */}
          {!isStakeholder && <EntryMetaBadges event={event} />}

          {/* Figma thumbnails — shown even when collapsed if links exist */}
          {figmaLinks && figmaLinks.length > 0 && (
            <FigmaThumbnails links={figmaLinks} />
          )}

          {/* Expanded detail — inline on desktop */}
          {expanded && !isMobile && (
            <EntryDetail
              event={event}
              rewrittenDescription={rewrittenDescription}
              viewMode={viewMode}
            />
          )}
        </button>

        {/* Bottom sheet detail — mobile only */}
        {isMobile && (
          <Sheet open={expanded} onOpenChange={setExpanded}>
            <SheetContent side="bottom" className="max-h-[80vh] overflow-y-auto rounded-t-xl">
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2 text-sm">
                  <div
                    className={cn(
                      'flex size-6 items-center justify-center rounded-full',
                      config.dotClass,
                    )}
                  >
                    <Icon className="size-3 text-white" />
                  </div>
                  <span className="truncate">
                    {isStakeholder && rewrittenDescription
                      ? rewrittenDescription
                      : event.title}
                  </span>
                </SheetTitle>
              </SheetHeader>
              <div className="px-4 pb-6">
                <EntryDetail
                  event={event}
                  rewrittenDescription={rewrittenDescription}
                  viewMode={viewMode}
                />
                {figmaLinks && figmaLinks.length > 0 && (
                  <div className="mt-4">
                    <FigmaThumbnails links={figmaLinks} />
                  </div>
                )}
              </div>
            </SheetContent>
          </Sheet>
        )}
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
        {meta.reviewCount != null && meta.reviewCount > 0 && (
          <Badge variant="outline" className="gap-1 text-[10px]">
            <MessageSquareIcon className="size-2.5" />
            {meta.reviewCount}
          </Badge>
        )}
        {meta.filesChanged != null && (
          <Badge variant="outline" className="gap-1 text-[10px]">
            <FilesIcon className="size-2.5" />
            {meta.filesChanged} files
          </Badge>
        )}
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
  viewMode = 'builder',
}: {
  event: TimelineEvent
  rewrittenDescription?: string
  viewMode?: ViewMode
}) {
  const isStakeholder = viewMode === 'stakeholder'

  return (
    <div
      className="mt-4 animate-ds-slide-down space-y-3 border-t border-border/40 pt-4"
      onClick={(e) => e.stopPropagation()}
    >
      {event.description && (
        <p className="text-xs leading-relaxed text-ds-text-secondary whitespace-pre-wrap">
          {isStakeholder && rewrittenDescription
            ? rewrittenDescription
            : event.description}
        </p>
      )}

      {/* Technical stats — only in Builder view */}
      {!isStakeholder && event.metadata.type === 'pr_merged' &&
        (event.metadata.additions != null || event.metadata.deletions != null) && (
        <div className="flex items-center gap-4 text-xs text-ds-text-tertiary">
          {event.metadata.additions != null && (
            <span className="flex items-center gap-1">
              <PlusIcon className="size-3 text-ds-success" />
              {event.metadata.additions} additions
            </span>
          )}
          {event.metadata.deletions != null && (
            <span className="flex items-center gap-1">
              <MinusIcon className="size-3 text-destructive" />
              {event.metadata.deletions} deletions
            </span>
          )}
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
