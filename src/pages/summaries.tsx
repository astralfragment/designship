import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { FileText, Copy, Sparkles, Clock, Check } from 'lucide-react'
import type { Summary, SummaryType } from '../../shared/ipc-types'

export function SummariesPage() {
  const qc = useQueryClient()
  const { data: summaries = [] } = useQuery({
    queryKey: ['summaries'],
    queryFn: () => window.ds.summary.list(),
  })

  const [summaryType, setSummaryType] = useState<SummaryType>('standup')
  const [useAI, setUseAI] = useState(false)

  const generate = useMutation({
    mutationFn: async () => {
      const now = new Date()
      const start = new Date(now)
      start.setDate(start.getDate() - (summaryType === 'standup' ? 1 : 7))
      return window.ds.summary.generate({
        type: summaryType,
        period_start: start.toISOString(),
        period_end: now.toISOString(),
        use_ai: useAI,
      })
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['summaries'] }),
  })

  return (
    <div className="mx-auto max-w-[640px]">
      <div className="mb-8">
        <h1 className="font-display text-[22px] font-bold tracking-tight text-text-primary">Summaries</h1>
        <p className="mt-0.5 text-[13px] text-text-secondary">
          Generate standups, digests, and changelogs from your activity.
        </p>
      </div>

      {/* Generator */}
      <div className="mb-6 rounded-xl border border-white/[0.06] bg-bg-card/60 p-4">
        <div className="flex flex-wrap items-center gap-2 mb-3">
          {(['standup', 'weekly', 'changelog'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setSummaryType(t)}
              className={`rounded-lg px-3 py-1.5 text-[12px] font-medium transition-colors ${
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
          <label className="flex items-center gap-2 text-[12px] text-text-secondary cursor-pointer">
            <input
              type="checkbox"
              checked={useAI}
              onChange={(e) => setUseAI(e.target.checked)}
              className="rounded border-white/20 bg-bg-secondary"
            />
            Use AI
          </label>
          <button
            onClick={() => generate.mutate()}
            disabled={generate.isPending}
            className="ml-auto flex items-center gap-1.5 rounded-lg bg-accent-ai/15 px-4 py-2 text-[13px] font-medium text-accent-ai hover:bg-accent-ai/25 disabled:opacity-50"
          >
            {generate.isPending ? <Clock className="size-3.5 animate-spin" /> : <Sparkles className="size-3.5" />}
            {generate.isPending ? 'Generating...' : 'Generate'}
          </button>
        </div>
      </div>

      {/* Results */}
      {(summaries as Summary[]).length === 0 ? (
        <div className="flex flex-col items-center rounded-xl border border-dashed border-white/[0.06] py-16 text-center">
          <FileText className="mb-2 size-6 text-text-muted/50" />
          <p className="text-[13px] text-text-secondary">No summaries yet. Generate one above.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {(summaries as Summary[]).map((s) => <SummaryCard key={s.id} summary={s} />)}
        </div>
      )}
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
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  })

  return (
    <div className="rounded-xl border border-white/[0.06] bg-bg-card/60 p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="rounded bg-accent-ai/15 px-2 py-0.5 text-[10px] font-medium uppercase text-accent-ai">
            {summary.type}
          </span>
          <span className="text-[11px] text-text-muted">{date}</span>
          {summary.model_used && summary.model_used !== 'none' && (
            <span className="text-[10px] text-text-muted/60">via {summary.model_used}</span>
          )}
        </div>
        <button onClick={handleCopy} className="flex items-center gap-1 rounded-md px-2 py-1 text-[11px] text-text-muted hover:bg-white/[0.04] hover:text-text-secondary">
          {copied ? <Check className="size-3 text-accent-git" /> : <Copy className="size-3" />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <pre className="whitespace-pre-wrap font-body text-[13px] leading-relaxed text-text-secondary">
        {summary.content}
      </pre>
    </div>
  )
}
