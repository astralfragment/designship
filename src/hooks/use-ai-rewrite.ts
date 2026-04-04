import { useQuery } from '@tanstack/react-query'
import { batchRewriteForHumans } from '@/lib/ai'
import type { TimelineEvent } from '../../app/components/timeline'

export function useAiRewrite(events: TimelineEvent[], enabled: boolean) {
  const texts = events.map(
    (e) => e.description || e.title,
  )

  const eventIds = events.map((e) => e.id).join(',')

  return useQuery({
    queryKey: ['ai-rewrite', eventIds],
    queryFn: async () => {
      const results = await batchRewriteForHumans(texts)
      const map: Record<string, string> = {}
      for (let i = 0; i < events.length; i++) {
        const event = events[i]
        const result = results[i]
        if (event && result) {
          map[event.id] = result.rewritten
        }
      }
      return map
    },
    enabled: enabled && events.length > 0,
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
  })
}
