import { useEffect, useRef, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { Sparkles, X } from 'lucide-react'
import type { FragmentType } from '../../shared/ipc-types'
import { useAppStore } from '../stores/app'
import { useAddFragment, useFragments } from '../hooks/useFragments'
import { useSeedSamples } from '../hooks/useConfig'
import { EmptyState } from '../components/EmptyState'

const TYPE_OPTIONS: { value: FragmentType; label: string; hint: string }[] = [
  { value: 'note', label: 'Note', hint: 'Generic context' },
  { value: 'feedback', label: 'Feedback', hint: 'From a user / customer' },
  { value: 'decision', label: 'Decision', hint: 'A choice that was made' },
  { value: 'requirement', label: 'Requirement', hint: 'Something the build must do' },
  { value: 'question', label: 'Question', hint: 'Open / unresolved' },
  { value: 'qa', label: 'QA', hint: 'Found in testing' },
]

export function CapturePage() {
  const projectId = useAppStore((s) => s.currentProjectId)
  const welcomeDismissed = useAppStore((s) => s.welcomeDismissed)
  const dismissWelcome = useAppStore((s) => s.dismissWelcome)
  const seed = useSeedSamples()

  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [type, setType] = useState<FragmentType>('note')
  const [tagsRaw, setTagsRaw] = useState('')
  const [source, setSource] = useState('')

  const titleRef = useRef<HTMLInputElement>(null)
  useEffect(() => {
    titleRef.current?.focus()
  }, [])

  const add = useAddFragment()
  const recent = useFragments({ project_id: projectId ?? undefined, limit: 5 })

  const handleSubmit = () => {
    if (!projectId || !title.trim()) return
    add.mutate(
      {
        project_id: projectId,
        title: title.trim(),
        content: content.trim(),
        type,
        source: source.trim() || null,
        tags: tagsRaw
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
      },
      {
        onSuccess: () => {
          setTitle('')
          setContent('')
          setTagsRaw('')
          setSource('')
          setType('note')
          titleRef.current?.focus()
        },
      },
    )
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault()
      handleSubmit()
    }
  }

  if (!projectId) {
    return (
      <EmptyState
        title="No workspace yet"
        description="Create a workspace in Settings, or load the sample one to see the workflow."
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

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <h1 className="serif text-4xl text-text-primary">Capture context</h1>
        <p className="mt-2 text-[15px] text-text-secondary">
          Paste a note, a quote, a decision. Tag it. Move on. We'll shape it
          into a spec when you're ready.
        </p>
      </div>

      {!welcomeDismissed && (
        <div className="relative rounded-2xl border border-border-subtle bg-gradient-to-br from-blush/40 via-lilac/30 to-sky/40 p-5">
          <button
            type="button"
            className="absolute right-3 top-3 text-text-muted hover:text-text-primary"
            onClick={dismissWelcome}
            aria-label="Dismiss"
          >
            <X size={16} />
          </button>
          <h2 className="serif text-xl text-text-primary">Welcome to Fragment</h2>
          <p className="mt-1 max-w-2xl text-[14px] leading-relaxed text-text-secondary">
            Fragment turns scattered product context into build-ready specs.
            Capture fragments here, group them by tag on{' '}
            <Link to="/fragments" className="font-medium text-plum underline">Fragments</Link>,
            then draft a spec on{' '}
            <Link to="/specs" search={{ draft: undefined }} className="font-medium text-plum underline">Specs</Link>.
            A sample workspace is pre-loaded — try drafting a spec from it now.
          </p>
        </div>
      )}

      <div className="card p-5" onKeyDown={onKeyDown}>
        <label className="block">
          <span className="text-[12px] font-medium uppercase tracking-wide text-text-muted">
            Title
          </span>
          <input
            ref={titleRef}
            className="input mt-1.5 w-full"
            placeholder="What did you just hear, see, or decide?"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </label>

        <div className="mt-4 flex flex-wrap gap-1.5">
          {TYPE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              className={`pill ${type === opt.value ? 'pill-active' : ''}`}
              onClick={() => setType(opt.value)}
              title={opt.hint}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <label className="mt-4 block">
          <span className="text-[12px] font-medium uppercase tracking-wide text-text-muted">
            Detail
          </span>
          <textarea
            className="input-textarea mt-1.5 w-full"
            placeholder={'The full quote, decision rationale, or background.\n\nMarkdown is fine.'}
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
        </label>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="text-[12px] font-medium uppercase tracking-wide text-text-muted">
              Tags
            </span>
            <input
              className="input mt-1.5 w-full"
              placeholder="onboarding, billing"
              value={tagsRaw}
              onChange={(e) => setTagsRaw(e.target.value)}
            />
          </label>
          <label className="block">
            <span className="text-[12px] font-medium uppercase tracking-wide text-text-muted">
              Source
            </span>
            <input
              className="input mt-1.5 w-full"
              placeholder="e.g. Customer interview — Maya"
              value={source}
              onChange={(e) => setSource(e.target.value)}
            />
          </label>
        </div>

        <div className="mt-5 flex items-center justify-between">
          <span className="text-[11px] text-text-muted">
            <kbd className="rounded border border-border-subtle bg-bg-secondary px-1.5 py-0.5 font-mono text-[10px]">
              {navigator.platform.includes('Mac') ? '⌘' : 'Ctrl'}+Enter
            </kbd>{' '}
            to save
          </span>
          <button
            type="button"
            className="btn-primary"
            onClick={handleSubmit}
            disabled={!title.trim() || add.isPending}
          >
            <Sparkles size={14} />
            {add.isPending ? 'Capturing…' : 'Capture fragment'}
          </button>
        </div>
      </div>

      {recent.data && recent.data.length > 0 && (
        <div>
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-[13px] font-medium uppercase tracking-wide text-text-muted">
              Recent captures
            </h2>
            <Link
              to="/fragments"
              className="text-[13px] text-plum underline-offset-2 hover:underline"
            >
              See all
            </Link>
          </div>
          <ul className="space-y-2">
            {recent.data.slice(0, 5).map((f) => (
              <li
                key={f.id}
                className="flex items-start gap-3 rounded-xl border border-border-subtle bg-bg-elevated px-4 py-3"
              >
                <span className="pill mt-0.5 shrink-0">{f.type}</span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[14px] font-medium text-text-primary">
                    {f.title}
                  </div>
                  {f.tags.length > 0 && (
                    <div className="mt-1 flex flex-wrap gap-1">
                      {f.tags.map((t) => (
                        <span key={t} className="text-[11px] text-text-muted">
                          #{t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
