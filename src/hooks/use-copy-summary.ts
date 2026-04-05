import { useState, useCallback } from 'react'
import type { WeeklySummary } from '@/lib/ai'
import { formatSummaryAsText, formatSummaryAsMarkdown } from '@/lib/format-summary'
import { useToast } from '../../app/components/toast'

export function useCopySummary(summary: WeeklySummary | null) {
  const [copied, setCopied] = useState<'text' | 'markdown' | null>(null)
  const { toast } = useToast()

  const handleCopy = useCallback(
    async (format: 'text' | 'markdown') => {
      if (!summary) return
      const content =
        format === 'markdown'
          ? formatSummaryAsMarkdown(summary)
          : formatSummaryAsText(summary)
      try {
        await navigator.clipboard.writeText(content)
        setCopied(format)
        toast(format === 'markdown' ? 'Copied as Markdown' : 'Copied for Slack', 'success')
        setTimeout(() => setCopied(null), 2000)
      } catch {
        toast('Failed to copy to clipboard', 'error')
      }
    },
    [summary, toast],
  )

  return { copied, handleCopy }
}
