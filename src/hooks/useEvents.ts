import { useQuery } from '@tanstack/react-query'
import type { EventFilters } from '../../shared/ipc-types'

export function useEvents(filters: EventFilters = {}) {
  return useQuery({
    queryKey: ['events', filters],
    queryFn: () => window.ds.events.list(filters),
    refetchInterval: 30_000, // Refresh every 30s
  })
}

export function useEventCount(filters: EventFilters = {}) {
  return useQuery({
    queryKey: ['events-count', filters],
    queryFn: () => window.ds.events.count(filters),
  })
}
