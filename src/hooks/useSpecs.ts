import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { SpecDraftOptions, SpecUpdateInput } from '../../shared/ipc-types'

export function useSpecs(projectId: string | null) {
  return useQuery({
    queryKey: ['specs', projectId],
    queryFn: () =>
      projectId ? window.fragment.specs.list(projectId) : Promise.resolve([]),
    enabled: !!projectId,
  })
}

export function useDraftSpec() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (opts: SpecDraftOptions) => window.fragment.specs.draft(opts),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['specs'] }),
  })
}

export function useUpdateSpec() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: SpecUpdateInput }) =>
      window.fragment.specs.update(id, patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['specs'] }),
  })
}

export function useDeleteSpec() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => window.fragment.specs.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['specs'] }),
  })
}
