import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

export function useProjects() {
  return useQuery({
    queryKey: ['projects'],
    queryFn: () => window.fragment.projects.list(),
  })
}

export function useCreateProject() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (name: string) => window.fragment.projects.create(name),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['projects'] }),
  })
}

export function useRenameProject() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) =>
      window.fragment.projects.rename(id, name),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['projects'] }),
  })
}

export function useRemoveProject() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => window.fragment.projects.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['projects'] })
      qc.invalidateQueries({ queryKey: ['fragments'] })
      qc.invalidateQueries({ queryKey: ['specs'] })
    },
  })
}
