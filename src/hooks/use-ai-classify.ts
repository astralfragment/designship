import { useQuery } from '@tanstack/react-query'
import { classifyByFeature } from '@/lib/ai'
import type { TimelineEvent } from '../../app/components/timeline'

export function useAiClassify(events: TimelineEvent[], enabled: boolean) {
  const entries = events.map((e) => ({
    id: e.id,
    title: e.title,
    description: e.description,
  }))

  const eventIds = events.map((e) => e.id).join(',')

  return useQuery({
    queryKey: ['ai-classify', eventIds],
    queryFn: () => classifyByFeature(entries),
    enabled: enabled && events.length > 0,
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
  })
}
