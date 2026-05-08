import { useMemo, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { CheckCircle2, Circle, Trash2, FileText } from 'lucide-react'
import { useAppStore } from '../stores/app'
import { useFragments, useDeleteFragment } from '../hooks/useFragments'
import { useSeedSamples } from '../hooks/useConfig'
import { EmptyState } from '../components/EmptyState'
import type { Fragment } from '../../shared/ipc-types'

export function FragmentsPage() {
  const navigate = useNavigate()
  const projectId = useAppStore((s) => s.currentProjectId)
  const selectedIds = useAppStore((s) => s.selectedFragmentIds)
  const toggleSelected = useAppStore((s) => s.toggleFragmentSelected)
  const setSelection = useAppStore((s) => s.setSelection)
  const clearSelection = useAppStore((s) => s.clearSelection)

  const [search, setSearch] = useState('')

  const fragments = useFragments({
    project_id: projectId ?? undefined,
    search: search.trim() || undefined,
  })
  const del = useDeleteFragment()
  const seed = useSeedSamples()

  const grouped = useMemo(() => {
    if (!fragments.data) return []
    return groupByTag(fragments.data)
  }, [fragments.data])

  if (!projectId) {
    return (
      <EmptyState
        title="No workspace selected"
        description="Pick or create a workspace in Settings to view its fragments."
        action={
          <button
            type="button"
            className="btn-primary"
            onClick={() => seed.mutate()}
          >
            Load sample workspace
          </button>
        }
      />
    )
  }

  if (fragments.data && fragments.data.length === 0) {
    return (
      <EmptyState
        title="No fragments yet"
        description="Capture some context — notes, feedback, decisions — and they'll group themselves by tag here."
        action={
          <div className="flex gap-2">
            <button
              type="button"
              className="btn-primary"
              onClick={() => navigate({ to: '/' })}
            >
              Capture a fragment
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => seed.mutate()}
            >
              Load sample workspace
            </button>
          </div>
        }
      />
    )
  }

  const draftFromSelection = () => {
    if (selectedIds.length === 0) return
    navigate({ to: '/specs', search: { draft: '1' } })
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="serif text-4xl text-text-primary">Fragments</h1>
          <p className="mt-1 text-[14px] text-text-secondary">
            Auto-grouped by tag. Select fragments below to draft a spec from
            them.
          </p>
        </div>
        <input
          className="input w-64"
          placeholder="Search…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {selectedIds.length > 0 && (
        <div className="sticky top-0 z-10 flex items-center justify-between rounded-xl border border-border-active bg-lilac/35 px-4 py-3 backdrop-blur">
          <span className="text-[14px] font-medium text-ink">
            {selectedIds.length} fragment{selectedIds.length === 1 ? '' : 's'} selected
          </span>
          <div className="flex gap-2">
            <button className="btn-ghost" onClick={clearSelection}>
              Clear
            </button>
            <button className="btn-primary" onClick={draftFromSelection}>
              <FileText size={14} />
              Draft spec from selection
            </button>
          </div>
        </div>
      )}

      <div className="space-y-8">
        {grouped.map(({ tag, items }) => (
          <section key={tag}>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-sans text-[13px] font-medium uppercase tracking-wide text-text-muted">
                #{tag} <span className="ml-1 text-text-muted/70">({items.length})</span>
              </h2>
              <button
                className="btn-ghost text-[12px]"
                onClick={() => setSelection(items.map((i) => i.id))}
              >
                Select all in #{tag}
              </button>
            </div>
            <ul className="space-y-2">
              {items.map((f) => {
                const selected = selectedIds.includes(f.id)
                return (
                  <li
                    key={f.id}
                    className={`group flex items-start gap-3 rounded-xl border bg-bg-elevated px-4 py-3 transition-colors ${
                      selected
                        ? 'border-iris/60 shadow-[0_4px_18px_rgba(159,135,255,0.18)]'
                        : 'border-border-subtle hover:border-border-soft'
                    }`}
                  >
                    <button
                      type="button"
                      className="mt-0.5 shrink-0 text-iris"
                      onClick={() => toggleSelected(f.id)}
                      aria-label={selected ? 'Deselect' : 'Select'}
                    >
                      {selected ? <CheckCircle2 size={20} /> : <Circle size={20} className="text-text-muted/60" />}
                    </button>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="pill">{f.type}</span>
                        <h3 className="text-[15px] font-medium text-text-primary">
                          {f.title}
                        </h3>
                      </div>
                      {f.content && (
                        <p className="mt-1.5 line-clamp-3 text-[13px] leading-relaxed text-text-secondary">
                          {f.content}
                        </p>
                      )}
                      <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] text-text-muted">
                        {f.source && <span>{f.source}</span>}
                        {f.tags.map((t) => (
                          <span key={t}>#{t}</span>
                        ))}
                      </div>
                    </div>
                    <button
                      type="button"
                      className="invisible shrink-0 self-center rounded p-1.5 text-text-muted hover:bg-bg-secondary hover:text-rose group-hover:visible"
                      onClick={() => {
                        if (confirm(`Delete fragment "${f.title}"?`)) del.mutate(f.id)
                      }}
                      aria-label="Delete"
                    >
                      <Trash2 size={14} />
                    </button>
                  </li>
                )
              })}
            </ul>
          </section>
        ))}
      </div>
    </div>
  )
}

function groupByTag(items: Fragment[]): { tag: string; items: Fragment[] }[] {
  const groups = new Map<string, Fragment[]>()
  for (const item of items) {
    const tags = item.tags.length > 0 ? item.tags : ['untagged']
    for (const tag of tags) {
      if (!groups.has(tag)) groups.set(tag, [])
      groups.get(tag)!.push(item)
    }
  }
  return [...groups.entries()]
    .map(([tag, items]) => ({ tag, items }))
    .sort((a, b) => b.items.length - a.items.length)
}
