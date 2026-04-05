import { useState, useCallback } from 'react'
import { generateWeeklySummary } from '@/lib/ai'
import { useAuth } from '@/lib/auth'
import type { WeeklySummary } from '@/lib/ai'
import type { TimelineEvent } from '../../app/components/timeline/types'

export function useWeeklySummary(events: TimelineEvent[]) {
  const { session } = useAuth()
  const [summary, setSummary] = useState<WeeklySummary | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const generate = useCallback(async () => {
    if (isGenerating) return
    if (events.length === 0) return
    if (!session?.access_token) {
      setError('Not authenticated')
      return
    }

    setIsGenerating(true)
    setError(null)

    try {
      // Filter to events from the last 7 days
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      const recentEvents = events.filter(
        (e) => new Date(e.timestamp) >= weekAgo,
      )

      const dateRange = {
        from: weekAgo.toISOString().split('T')[0]!,
        to: new Date().toISOString().split('T')[0]!,
      }

      if (recentEvents.length === 0) {
        setSummary({
          shipped: ['No activity in the past 7 days'],
          inProgress: [],
          keyDecisions: [],
          dateRange,
          generatedAt: new Date().toISOString(),
        })
        return
      }

      const entries = recentEvents.map((e) => ({
        title: e.title,
        description: e.description,
        date: new Date(e.timestamp).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        }),
      }))

      const result = await generateWeeklySummary(entries, dateRange, session.access_token)
      setSummary(result)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to generate summary',
      )
    } finally {
      setIsGenerating(false)
    }
  }, [events, session?.access_token, isGenerating])

  const reset = useCallback(() => {
    setSummary(null)
    setError(null)
  }, [])

  return { summary, isGenerating, error, generate, reset }
}
