import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

export function useProjects() {
  return useQuery({
    queryKey: ['projects'],
    queryFn: () => window.ds.projects.list(),
  })
}

export function useAddFigmaProject() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (fileUrl: string) => window.ds.projects.addFigma(fileUrl),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['projects'] }),
  })
}

export function useAddGitProject() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async () => {
      const path = await window.ds.git.browseRepo()
      if (!path) return null
      return window.ds.projects.addGit(path)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['projects'] }),
  })
}

export function useRemoveProject() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => window.ds.projects.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['projects'] })
      qc.invalidateQueries({ queryKey: ['events'] })
    },
  })
}
