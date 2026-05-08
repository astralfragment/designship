import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { AIProviderConfig } from '../../shared/ipc-types'

export function useConfig() {
  return useQuery({
    queryKey: ['config'],
    queryFn: () => window.fragment.config.get(),
  })
}

export function useSetAI() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (config: AIProviderConfig) =>
      window.fragment.config.setAI(config),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['config'] }),
  })
}

export function useSetCurrentProject() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (projectId: string) =>
      window.fragment.config.setCurrentProject(projectId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['config'] }),
  })
}

export function useSeedSamples() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => window.fragment.seed.samples(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['projects'] })
      qc.invalidateQueries({ queryKey: ['fragments'] })
    },
  })
}
