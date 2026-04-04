import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  fetchSummaries,
  saveSummary,
  deleteSummary,
} from '@/lib/summaries'
import type { StoredSummary } from '@/lib/summaries'
import type { WeeklySummary } from '@/lib/ai'

const SUMMARIES_KEY = ['summaries'] as const

export function useSummaries() {
  return useQuery<StoredSummary[]>({
    queryKey: SUMMARIES_KEY,
    queryFn: fetchSummaries,
  })
}

export function useSaveSummary() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      summary,
      repoName,
    }: {
      summary: WeeklySummary
      repoName?: string
    }) => saveSummary(summary, repoName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SUMMARIES_KEY })
    },
  })
}

export function useDeleteSummary() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => deleteSummary(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SUMMARIES_KEY })
    },
  })
}
