import { createRoute } from '@tanstack/react-router'
import { Route as rootRoute } from './__root'
import { useEvents } from '../hooks/useEvents'
import { useAppStore } from '../stores/app'
import { Clock, Figma, GitBranch, Sparkles, Copy, RefreshCw } from 'lucide-react'
import type { DSEvent } from '../../shared/ipc-types'

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: TimelinePage,
})

function TimelinePage() {
  const { sourceFilter, setSourceFilter, viewMode, setViewMode } = useAppStore()
  const { data: events = [], isLoading, refetch } = useEvents(
    sourceFilter ? { source: sourceFilter } : {},
  )

  return (
    <div className="mx-auto max-w-2xl animate-fade-in">
      {/* Header */}
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-text-primary">Timeline</h1>
          <p className="mt-1 text-sm text-text-secondary">
            Your recent design and development activity.
          </p>
        </div>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-1.5 rounded-lg bg-bg-card px-3 py-1.5 text-xs text-text-secondary transition-colors hover:bg-bg-tertiary hover:text-text-primary"
        >
          <RefreshCw className="size-3" />
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="mb-6 flex items-center gap-2">
        <ViewToggle viewMode={viewMode} onChange={setViewMode} />
        <div className="mx-2 h-4 w-px bg-border-subtle" />
        <FilterChip
          active={sourceFilter === null}
          onClick={() => setSourceFilter(null)}
        >
          All
        </FilterChip>
        <FilterChip
          active={sourceFilter === 'figma'}
          onClick={() => setSourceFilter(sourceFilter === 'figma' ? null : 'figma')}
          color="figma"
        >
          <Figma className="size-3" /> Figma
        </FilterChip>
        <FilterChip
          active={sourceFilter === 'git'}
          onClick={() => setSourceFilter(sourceFilter === 'git' ? null : 'git')}
          color="git"
        >
          <GitBranch className="size-3" /> Git
        </FilterChip>
      </div>

      {/* Timeline */}
      {isLoading ? (
        <div className="flex flex-col gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-bg-card" />
          ))}
        </div>
      ) : events.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="flex flex-col gap-3">
          {events.map((event, i) => (
            <EventCard key={event.id} event={event} index={i} />
          ))}
        </div>
      )}
    </div>
  )
}

function EventCard({ event, index }: { event: DSEvent; index: number }) {
  const isFigma = event.source === 'figma'
  const accentColor = isFigma ? 'accent-figma' : 'accent-git'
  const glowStyle = isFigma ? 'var(--glow-figma)' : 'var(--glow-git)'
  const Icon = isFigma ? Figma : GitBranch

  const time = new Date(event.timestamp).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <div
      className="animate-slide-up rounded-xl border border-border-subtle bg-bg-card p-4 transition-all hover:border-border-active"
      style={{ animationDelay: `${index * 50}ms`, boxShadow: 'none' }}
      onMouseEnter={(e) => { e.currentTarget.style.boxShadow = glowStyle }}
      onMouseLeave={(e) => { e.currentTarget.style.boxShadow = 'none' }}
    >
      <div className="flex items-start gap-3">
        {/* Source dot */}
        <div className={`mt-1 flex size-8 shrink-0 items-center justify-center rounded-lg bg-${accentColor}/10`}>
          <Icon className={`size-4 text-${accentColor}`} />
        </div>

        <div className="min-w-0 flex-1">
          {/* Meta line */}
          <div className="flex items-center gap-2 text-xs text-text-muted">
            <span className={`font-medium uppercase text-${accentColor}`}>
              {event.source}
            </span>
            <span>{time}</span>
            {event.actor && (
              <>
                <span>·</span>
                <span>{event.actor}</span>
              </>
            )}
          </div>

          {/* Title */}
          <p className="mt-1 text-sm font-medium text-text-primary">{event.title}</p>

          {/* Body preview */}
          {event.body && event.body !== event.title && (
            <p className="mt-1 line-clamp-2 text-xs text-text-secondary">
              {event.body}
            </p>
          )}

          {/* Figma link indicator */}
          {event.metadata?.figmaLinks && (
            <div className="mt-2 flex items-center gap-1 text-xs text-accent-link">
              <Sparkles className="size-3" />
              Linked to Figma design
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border-subtle bg-bg-card/50 py-16 text-center">
      <Clock className="mb-3 size-8 text-text-muted" />
      <h3 className="font-display text-lg font-semibold text-text-primary">
        No activity yet
      </h3>
      <p className="mt-1 max-w-xs text-sm text-text-secondary">
        Connect a Figma file or Git repository in Settings to start watching activity.
      </p>
    </div>
  )
}

function ViewToggle({ viewMode, onChange }: { viewMode: string; onChange: (m: 'builder' | 'stakeholder') => void }) {
  return (
    <div className="flex rounded-lg bg-bg-secondary p-0.5">
      {(['builder', 'stakeholder'] as const).map((mode) => (
        <button
          key={mode}
          onClick={() => onChange(mode)}
          className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
            viewMode === mode
              ? 'bg-bg-tertiary text-text-primary'
              : 'text-text-muted hover:text-text-secondary'
          }`}
        >
          {mode === 'builder' ? '<> Builder' : 'Stakeholder'}
        </button>
      ))}
    </div>
  )
}

function FilterChip({
  active,
  onClick,
  color,
  children,
}: {
  active: boolean
  onClick: () => void
  color?: 'figma' | 'git'
  children: React.ReactNode
}) {
  const activeStyles = color
    ? `bg-${color === 'figma' ? 'accent-figma' : 'accent-git'}/15 text-${color === 'figma' ? 'accent-figma' : 'accent-git'} border-${color === 'figma' ? 'accent-figma' : 'accent-git'}/30`
    : 'bg-bg-tertiary text-text-primary border-border-active'

  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
        active ? activeStyles : 'border-border-subtle text-text-muted hover:text-text-secondary'
      }`}
    >
      {children}
    </button>
  )
}
