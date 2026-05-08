import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearch } from '@tanstack/react-router'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import {
  Sparkles,
  Wand2,
  Copy,
  Check,
  Save,
  Github,
  Trash2,
  Eye,
  Pencil,
} from 'lucide-react'
import { useAppStore } from '../stores/app'
import { useFragments } from '../hooks/useFragments'
import {
  useSpecs,
  useDraftSpec,
  useUpdateSpec,
  useDeleteSpec,
} from '../hooks/useSpecs'
import { useConfig } from '../hooks/useConfig'
import { EmptyState } from '../components/EmptyState'
import type { Spec } from '../../shared/ipc-types'

export function SpecsPage() {
  const navigate = useNavigate()
  const search = useSearch({ strict: false }) as { draft?: string }
  const projectId = useAppStore((s) => s.currentProjectId)
  const selectedIds = useAppStore((s) => s.selectedFragmentIds)
  const clearSelection = useAppStore((s) => s.clearSelection)
  const activeSpecId = useAppStore((s) => s.activeSpecId)
  const setActiveSpecId = useAppStore((s) => s.setActiveSpecId)

  const specs = useSpecs(projectId)
  const fragments = useFragments({ project_id: projectId ?? undefined })
  const config = useConfig()
  const draft = useDraftSpec()
  const update = useUpdateSpec()
  const del = useDeleteSpec()

  const aiAvailable = config.data?.aiProvider.provider !== 'none'

  const triggerDraft = (useAI: boolean) => {
    if (!projectId) return
    let ids = selectedIds
    if (ids.length === 0) {
      ids = (fragments.data ?? []).map((f) => f.id)
    }
    if (ids.length === 0) return
    draft.mutate(
      {
        project_id: projectId,
        fragment_ids: ids,
        use_ai: useAI,
      },
      {
        onSuccess: (created) => {
          setActiveSpecId(created.id)
          clearSelection()
        },
      },
    )
  }

  useEffect(() => {
    if (search?.draft === '1' && projectId) {
      triggerDraft(false)
      navigate({ to: '/specs', search: { draft: undefined }, replace: true })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search?.draft, projectId])

  if (!projectId) {
    return (
      <EmptyState
        title="No workspace"
        description="Pick a workspace in Settings to view its specs."
      />
    )
  }

  const activeSpec =
    specs.data?.find((s) => s.id === activeSpecId) ?? specs.data?.[0] ?? null

  const noFragments = (fragments.data?.length ?? 0) === 0

  return (
    <div className="grid h-full grid-cols-[260px_minmax(0,1fr)] gap-6">
      <aside className="space-y-3">
        <div className="space-y-1">
          <h1 className="serif text-3xl text-text-primary">Specs</h1>
          <p className="text-[13px] text-text-secondary">
            Drafts shaped from your fragments.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <button
            type="button"
            className="btn-primary justify-start"
            onClick={() => triggerDraft(false)}
            disabled={draft.isPending || noFragments}
            title={
              selectedIds.length > 0
                ? `Draft from ${selectedIds.length} selected fragment(s)`
                : 'Draft from all fragments in this workspace'
            }
          >
            <Sparkles size={14} />
            {draft.isPending && !draft.variables?.use_ai
              ? 'Drafting…'
              : selectedIds.length > 0
                ? `Draft from ${selectedIds.length} selected`
                : 'Draft from all fragments'}
          </button>
          <button
            type="button"
            className="btn-secondary justify-start"
            onClick={() => triggerDraft(true)}
            disabled={draft.isPending || noFragments || !aiAvailable}
            title={
              aiAvailable
                ? 'Use AI to improve the draft'
                : 'Configure AI in Settings to enable'
            }
          >
            <Wand2 size={14} />
            {draft.isPending && draft.variables?.use_ai
              ? 'Drafting with AI…'
              : 'Draft with AI'}
          </button>
        </div>

        {!aiAvailable && (
          <p className="text-[11px] leading-relaxed text-text-muted">
            AI is optional. Configure a Claude key or Ollama in{' '}
            <button
              className="underline"
              onClick={() => navigate({ to: '/settings' })}
            >
              Settings
            </button>{' '}
            to enable AI drafts.
          </p>
        )}

        <div className="mt-4 space-y-1">
          <h2 className="text-[11px] font-medium uppercase tracking-wide text-text-muted">
            Saved specs
          </h2>
          {(specs.data ?? []).length === 0 ? (
            <p className="rounded-lg border border-dashed border-border-subtle px-3 py-4 text-[12px] text-text-muted">
              No specs yet. Draft one to get started.
            </p>
          ) : (
            <ul className="space-y-1">
              {specs.data!.map((s) => (
                <li key={s.id}>
                  <button
                    type="button"
                    onClick={() => setActiveSpecId(s.id)}
                    className={`block w-full rounded-lg border px-3 py-2 text-left text-[13px] transition-colors ${
                      s.id === activeSpec?.id
                        ? 'border-iris/40 bg-lilac/30'
                        : 'border-border-subtle bg-bg-elevated hover:bg-bg-secondary'
                    }`}
                  >
                    <div className="truncate font-medium text-text-primary">
                      {s.title}
                    </div>
                    <div className="text-[11px] text-text-muted">
                      {s.status} · {s.fragment_ids.length} fragment
                      {s.fragment_ids.length === 1 ? '' : 's'}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </aside>

      <main className="min-w-0">
        {activeSpec ? (
          <SpecView
            key={activeSpec.id}
            spec={activeSpec}
            onUpdate={(patch) => update.mutate({ id: activeSpec.id, patch })}
            onDelete={() => {
              if (confirm(`Delete spec "${activeSpec.title}"?`)) {
                del.mutate(activeSpec.id, {
                  onSuccess: () => setActiveSpecId(null),
                })
              }
            }}
          />
        ) : (
          <EmptyState
            title="No spec selected"
            description={
              noFragments
                ? 'Capture a few fragments first, then come back to draft a spec.'
                : 'Click "Draft from all fragments" to generate your first spec.'
            }
            action={
              !noFragments && (
                <button
                  className="btn-primary"
                  onClick={() => triggerDraft(false)}
                  disabled={draft.isPending}
                >
                  <Sparkles size={14} />
                  Draft a spec
                </button>
              )
            }
          />
        )}
      </main>
    </div>
  )
}

function SpecView({
  spec,
  onUpdate,
  onDelete,
}: {
  spec: Spec
  onUpdate: (patch: { title?: string; content_md?: string }) => void
  onDelete: () => void
}) {
  const [editing, setEditing] = useState(false)
  const [draftMd, setDraftMd] = useState(spec.content_md)
  const [draftTitle, setDraftTitle] = useState(spec.title)
  const [copied, setCopied] = useState<'md' | 'gh' | null>(null)
  const [savedPath, setSavedPath] = useState<string | null>(null)

  useEffect(() => {
    setDraftMd(spec.content_md)
    setDraftTitle(spec.title)
    setEditing(false)
    setSavedPath(null)
  }, [spec.id])

  const dirty = useMemo(
    () => draftMd !== spec.content_md || draftTitle !== spec.title,
    [draftMd, draftTitle, spec],
  )

  const save = () => {
    onUpdate({ title: draftTitle, content_md: draftMd })
    setEditing(false)
  }

  const copy = async (kind: 'md' | 'gh') => {
    const content =
      kind === 'gh'
        ? await window.fragment.specs.export(spec.id, 'github')
        : draftMd
    await navigator.clipboard.writeText(content)
    setCopied(kind)
    setTimeout(() => setCopied(null), 1500)
  }

  const saveAs = async () => {
    const path = await window.fragment.specs.saveAs(spec.id)
    if (path) setSavedPath(path)
  }

  return (
    <div className="flex h-full flex-col">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <input
          className="input w-full max-w-xl text-lg font-medium"
          value={draftTitle}
          onChange={(e) => setDraftTitle(e.target.value)}
          disabled={!editing}
        />
        <div className="flex flex-wrap gap-1.5">
          {!editing ? (
            <button className="btn-secondary" onClick={() => setEditing(true)}>
              <Pencil size={14} />
              Edit
            </button>
          ) : (
            <>
              <button
                className="btn-secondary"
                onClick={() => {
                  setDraftMd(spec.content_md)
                  setDraftTitle(spec.title)
                  setEditing(false)
                }}
              >
                Cancel
              </button>
              <button
                className="btn-primary"
                onClick={save}
                disabled={!dirty}
              >
                <Eye size={14} />
                Save
              </button>
            </>
          )}
          <button className="btn-secondary" onClick={() => copy('md')}>
            {copied === 'md' ? <Check size={14} /> : <Copy size={14} />}
            {copied === 'md' ? 'Copied' : 'Copy markdown'}
          </button>
          <button className="btn-secondary" onClick={() => copy('gh')}>
            {copied === 'gh' ? <Check size={14} /> : <Github size={14} />}
            {copied === 'gh' ? 'Copied' : 'Copy as GitHub issue'}
          </button>
          <button className="btn-secondary" onClick={saveAs}>
            <Save size={14} />
            Save as .md
          </button>
          <button
            className="btn-ghost text-rose"
            onClick={onDelete}
            aria-label="Delete spec"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {savedPath && (
        <div className="mb-3 rounded-lg border border-mint/60 bg-mint/40 px-3 py-2 text-[13px] text-ink">
          Saved to <code className="font-mono">{savedPath}</code>
        </div>
      )}

      <div className="card flex-1 overflow-hidden">
        {editing ? (
          <div className="grid h-full grid-cols-2 divide-x divide-border-subtle">
            <textarea
              className="h-full w-full resize-none border-0 bg-transparent p-5 font-mono text-[13px] leading-relaxed text-text-primary outline-none"
              value={draftMd}
              onChange={(e) => setDraftMd(e.target.value)}
            />
            <div className="prose-fragment h-full overflow-y-auto p-6">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{draftMd}</ReactMarkdown>
            </div>
          </div>
        ) : (
          <div className="prose-fragment h-full overflow-y-auto p-8">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {spec.content_md}
            </ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  )
}
