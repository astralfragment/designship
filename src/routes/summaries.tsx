import { createRoute } from '@tanstack/react-router'
import { Route as rootRoute } from './__root'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { FileText, Copy, Sparkles, Clock, Check } from 'lucide-react'
import type { Summary, SummaryType } from '../../shared/ipc-types'

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: '/summaries',
  component: SummariesPage,
})

function SummariesPage() {
  const qc = useQueryClient()
  const { data: summaries = [] } = useQuery({
    queryKey: ['summaries'],
    queryFn: () => window.ds.summary.list(),
  })

  const [generating, setGenerating] = useState(false)
  const [summaryType, setSummaryType] = useState<SummaryType>('standup')
  const [useAI, setUseAI] = useState(false)

  const generate = useMutation({
    mutationFn: async () => {
      const now = new Date()
      const weekAgo = new Date(now)
      weekAgo.setDate(weekAgo.getDate() - (summaryType === 'standup' ? 1 : 7))

      return window.ds.summary.generate({
        type: summaryType,
        period_start: weekAgo.toISOString(),
        period_end: now.toISOString(),
        use_ai: useAI,
      })
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['summaries'] })
    },
  })

  return (
    <div className="mx-auto max-w-2xl animate-fade-in">
      <h1 className="font-display text-2xl font-bold text-text-primary">Summaries</h1>
      <p className="mt-1 text-sm text-text-secondary">
        Generate standups, weekly digests, and changelogs from your activity.
      </p>

      {/* Generator */}
      <div className="mt-6 rounded-xl border border-border-subtle bg-bg-card p-4">
        <div className="flex items-center gap-2 mb-3">
          {(['standup', 'weekly', 'changelog'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setSummaryType(t)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium ${
                summaryType === t
                  ? 'bg-accent-ai/15 text-accent-ai'
                  : 'bg-bg-secondary text-text-muted hover:text-text-secondary'
              }`}
            >
              {t === 'standup' ? 'Standup' : t === 'weekly' ? 'Weekly Digest' : 'Changelog'}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-xs text-text-secondary">
            <input
              type="checkbox"
              checked={useAI}
              onChange={(e) => setUseAI(e.target.checked)}
              className="rounded"
            />
            Use AI (requires configured provider)
          </label>

          <button
            onClick={() => generate.mutate()}
            disabled={generate.isPending}
            className="ml-auto flex items-center gap-1.5 rounded-lg bg-accent-ai/15 px-4 py-2 text-sm font-medium text-accent-ai hover:bg-accent-ai/25 disabled:opacity-50"
          >
            {generate.isPending ? (
              <Clock className="size-3.5 animate-spin" />
            ) : (
              <Sparkles className="size-3.5" />
            )}
            {generate.isPending ? 'Generating...' : 'Generate'}
          </button>
        </div>
      </div>

      {/* Summary list */}
      <div className="mt-6 flex flex-col gap-3">
        {summaries.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border-subtle bg-bg-card/50 py-12 text-center">
            <FileText className="mx-auto mb-2 size-6 text-text-muted" />
            <p className="text-sm text-text-secondary">No summaries generated yet.</p>
          </div>
        ) : (
          summaries.map((s: Summary) => <SummaryCard key={s.id} summary={s} />)
        )}
      </div>
    </div>
  )
}

function SummaryCard({ summary }: { summary: Summary }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(summary.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const date = new Date(summary.created_at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <div className="rounded-xl border border-border-subtle bg-bg-card p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="rounded bg-accent-ai/15 px-2 py-0.5 text-[10px] font-medium uppercase text-accent-ai">
            {summary.type}
          </span>
          <span className="text-xs text-text-muted">{date}</span>
          {summary.model_used && (
            <span className="text-[10px] text-text-muted">via {summary.model_used}</span>
          )}
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 rounded px-2 py-1 text-xs text-text-muted hover:text-text-secondary"
        >
          {copied ? <Check className="size-3" /> : <Copy className="size-3" />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <pre className="whitespace-pre-wrap font-body text-sm text-text-secondary leading-relaxed">
        {summary.content}
      </pre>
    </div>
  )
}
