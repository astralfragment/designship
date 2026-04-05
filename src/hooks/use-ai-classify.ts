import { useQuery } from '@tanstack/react-query'
import { classifyByFeature } from '@/lib/ai'
import { useAuth } from '@/lib/auth'
import type { TimelineEvent } from '../../app/components/timeline'

export function useAiClassify(events: TimelineEvent[], enabled: boolean) {
  const { session } = useAuth()
  const entries = events.map((e) => ({
    id: e.id,
    title: e.title,
    description: e.description,
  }))

  const stableKey = events.map((e) => e.id).join(',')

  return useQuery({
    queryKey: ['ai-classify', stableKey],
    queryFn: () => {
      if (!session?.access_token) throw new Error('Not authenticated')
      return classifyByFeature(entries, session.access_token)
    },
    enabled: enabled && events.length > 0 && !!session?.access_token,
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
    placeholderData: (prev) => prev,
  })
}
