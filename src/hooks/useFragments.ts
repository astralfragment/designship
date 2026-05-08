import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { FragmentFilters, FragmentInput } from '../../shared/ipc-types'

export function useFragments(filters: FragmentFilters = {}) {
  return useQuery({
    queryKey: ['fragments', filters],
    queryFn: () => window.fragment.fragments.list(filters),
  })
}

export function useAddFragment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: FragmentInput) => window.fragment.fragments.add(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['fragments'] }),
  })
}

export function useUpdateFragment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<FragmentInput> }) =>
      window.fragment.fragments.update(id, patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['fragments'] }),
  })
}

export function useDeleteFragment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => window.fragment.fragments.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['fragments'] }),
  })
}
