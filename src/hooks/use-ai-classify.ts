import { useQuery, useQueryClient } from '@tanstack/react-query'
import { classifyByFeature } from '@/lib/ai'
import { useAuth } from '@/lib/auth'
import type { TimelineEvent } from '../../app/components/timeline'

export function useAiClassify(events: TimelineEvent[], enabled: boolean) {
  const { session } = useAuth()
  const queryClient = useQueryClient()

  const stableKey = events.map((e) => e.id).join(',')

  return useQuery({
    queryKey: ['ai-classify', stableKey],
    queryFn: async () => {
      if (!session?.access_token) throw new Error('Not authenticated')

      // Carry forward previous classifications to avoid re-sending already-classified events
      const prevData = queryClient.getQueryData<Record<string, string>>(['ai-classify'])
        ?? Object.fromEntries(
          queryClient.getQueriesData<Record<string, string>>({ queryKey: ['ai-classify'] })
            .flatMap(([, data]) => data ? Object.entries(data) : []),
        )

      const unclassified = events.filter((e) => !prevData[e.id])

      if (unclassified.length === 0) return prevData

      const entries = unclassified.map((e) => ({
        id: e.id,
        title: e.title,
        description: e.description,
      }))

      const newResults = await classifyByFeature(entries, session.access_token)
      return { ...prevData, ...newResults }
    },
    enabled: enabled && events.length > 0 && !!session?.access_token,
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
    placeholderData: (prev) => prev,
  })
}
