import { useState, useCallback } from 'react'
import { generateWeeklySummary } from '@/lib/ai'
import type { WeeklySummary } from '@/lib/ai'
import type { TimelineEvent } from '../../app/components/timeline/types'

export function useWeeklySummary(events: TimelineEvent[]) {
  const [summary, setSummary] = useState<WeeklySummary | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const generate = useCallback(async () => {
    if (events.length === 0) return

    setIsGenerating(true)
    setError(null)

    try {
      // Filter to events from the last 7 days
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      const recentEvents = events.filter(
        (e) => new Date(e.timestamp) >= weekAgo,
      )

      const entries = (recentEvents.length > 0 ? recentEvents : events).map(
        (e) => ({
          title: e.title,
          description: e.description,
          date: new Date(e.timestamp).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
          }),
        }),
      )

      const result = await generateWeeklySummary(entries)
      setSummary(result)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to generate summary',
      )
    } finally {
      setIsGenerating(false)
    }
  }, [events])

  const reset = useCallback(() => {
    setSummary(null)
    setError(null)
  }, [])

  return { summary, isGenerating, error, generate, reset }
}
