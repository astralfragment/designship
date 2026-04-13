import { useState } from 'react'
import { useEvents } from '../hooks/useEvents'
import { useAppStore } from '../stores/app'
import {
  Clock, GitCommit, Figma, RefreshCw, ChevronDown, Link2,
} from 'lucide-react'
import type { DSEvent } from '../../shared/ipc-types'

export function TimelinePage() {
  const { sourceFilter, setSourceFilter, viewMode, setViewMode } = useAppStore()
  const { data: events = [], isLoading, refetch, isFetching } = useEvents(
    sourceFilter ? { source: sourceFilter, limit: 50 } : { limit: 50 },
  )

  return (
    <div className="mx-auto max-w-[640px]">
      <div className="mb-8">
        <h1 className="font-display text-[22px] font-bold tracking-tight text-text-primary">
          Timeline
        </h1>
        <p className="mt-0.5 text-[13px] text-text-secondary">
          Design and development activity at a glance.
        </p>
      </div>

      {/* Controls */}
      <div className="mb-5 flex flex-wrap items-center gap-2">
        <div className="flex rounded-lg border border-white/[0.06] bg-bg-secondary p-0.5">
          {(['builder', 'stakeholder'] as const).map((m) => (
            <button
              key={m}
              onClick={() => setViewMode(m)}
              className={`rounded-md px-3 py-1 text-[12px] font-medium transition-all ${
                viewMode === m
                  ? 'bg-white/[0.1] text-text-primary'
                  : 'text-text-muted hover:text-text-secondary'
              }`}
            >
              {m === 'builder' ? '<> Builder' : 'Stakeholder'}
            </button>
          ))}
        </div>

        <div className="h-4 w-px bg-white/[0.06]" />

        <FilterPill active={!sourceFilter} onClick={() => setSourceFilter(null)} label="All" />
        <FilterPill active={sourceFilter === 'figma'} onClick={() => setSourceFilter(sourceFilter === 'figma' ? null : 'figma')} label="Figma" color="#a259ff" />
        <FilterPill active={sourceFilter === 'git'} onClick={() => setSourceFilter(sourceFilter === 'git' ? null : 'git')} label="Git" color="#58d68d" />

        <div className="flex-1" />

        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="flex items-center gap-1.5 rounded-lg border border-white/[0.06] px-2.5 py-1.5 text-[11px] text-text-muted hover:text-text-secondary disabled:opacity-50"
        >
          <RefreshCw className={`size-3 ${isFetching ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Events */}
      {isLoading ? (
        <LoadingSkeleton />
      ) : events.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="flex flex-col gap-1">
          {events.map((event, i) => (
            <EventRow key={event.id} event={event} index={i} />
          ))}
        </div>
      )}
    </div>
  )
}

function EventRow({ event, index }: { event: DSEvent; index: number }) {
  const [expanded, setExpanded] = useState(false)
  const isFigma = event.source === 'figma'
  const color = isFigma ? '#a259ff' : '#58d68d'
  const Icon = isFigma ? Figma : GitCommit

  const time = new Date(event.timestamp)
  const dateStr = time.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  const timeStr = time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })

  const meta = event.metadata as Record<string, unknown> | null
  const hash = meta?.commitHash as string | undefined
  const figmaLinks = (meta?.figmaLinks ?? []) as string[]
  const isAgent = !!meta?.isAgent
  const agentName = meta?.agentName as string | undefined
  const repoName = meta?.repoName as string | undefined

  return (
    <div
      className="group rounded-xl bg-bg-card/40 px-4 py-3 transition-colors hover:bg-bg-card"
      style={{ animation: `slide-up 0.3s ease-out ${index * 25}ms both` }}
    >
      <div className="flex items-start gap-3">
        <div
          className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg"
          style={{ backgroundColor: `${color}12` }}
        >
          <Icon className="size-3.5" style={{ color }} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 text-[11px]">
            <span className="font-medium uppercase tracking-wide" style={{ color }}>{event.source}</span>
            {repoName && <span className="text-text-muted/60">{repoName}</span>}
            <span className="text-text-muted">{dateStr} {timeStr}</span>
            {isAgent && (
              <span className="rounded bg-accent-ai/15 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-accent-ai">
                {agentName ?? 'Agent'}
              </span>
            )}
            {event.actor && <span className="ml-auto text-text-muted">{event.actor}</span>}
          </div>

          <p className="mt-0.5 text-[13px] font-medium leading-snug text-text-primary">
            {event.title}
          </p>

          {hash && (
            <code className="mt-0.5 inline-block font-mono text-[10px] text-text-muted/60">
              {hash.slice(0, 7)}
            </code>
          )}

          {figmaLinks.length > 0 && (
            <div className="mt-1 flex items-center gap-1 text-[11px] text-accent-link">
              <Link2 className="size-3" /> Linked to Figma
            </div>
          )}

          {event.body && event.body !== event.title && (
            <>
              <button
                onClick={() => setExpanded(!expanded)}
                className="mt-1 flex items-center gap-1 text-[11px] text-text-muted hover:text-text-secondary"
              >
                <ChevronDown className={`size-3 transition-transform ${expanded ? 'rotate-180' : ''}`} />
                {expanded ? 'Less' : 'Details'}
              </button>
              {expanded && (
                <pre className="mt-2 whitespace-pre-wrap rounded-lg bg-bg-primary/60 p-3 font-body text-[12px] leading-relaxed text-text-secondary">
                  {event.body}
                </pre>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/[0.06] py-20 text-center">
      <Clock className="mb-3 size-8 text-text-muted/50" />
      <h3 className="font-display text-base font-semibold text-text-primary">No activity yet</h3>
      <p className="mt-1 max-w-[260px] text-[13px] text-text-secondary">
        Connect a Figma file or Git repo in Settings.
      </p>
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <div className="flex flex-col gap-2">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="h-16 animate-pulse rounded-xl bg-bg-card/40" style={{ animationDelay: `${i * 80}ms` }} />
      ))}
    </div>
  )
}

function FilterPill({ active, onClick, label, color }: {
  active: boolean; onClick: () => void; label: string; color?: string
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full border px-2.5 py-1 text-[11px] font-medium transition-all ${
        active
          ? color ? 'border-transparent text-white' : 'border-white/[0.1] bg-white/[0.08] text-text-primary'
          : 'border-white/[0.06] text-text-muted hover:text-text-secondary'
      }`}
      style={active && color ? { backgroundColor: `${color}20`, color, borderColor: `${color}30` } : undefined}
    >
      {label}
    </button>
  )
}
