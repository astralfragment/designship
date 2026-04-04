import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/lib/auth'
import {
  fetchUserRepos,
  fetchMergedPRs,
  fetchCommits,
} from '@/lib/github'

export function useRepos() {
  const { githubToken } = useAuth()

  return useQuery({
    queryKey: ['github', 'repos'],
    queryFn: () => fetchUserRepos(githubToken),
    enabled: !!githubToken,
    staleTime: 5 * 60 * 1000,
  })
}

export function useMergedPRs(
  owner: string,
  repo: string,
  since?: string,
) {
  const { githubToken } = useAuth()

  return useQuery({
    queryKey: ['github', 'prs', owner, repo, since],
    queryFn: () => fetchMergedPRs(owner, repo, since, githubToken),
    enabled: !!githubToken && !!owner && !!repo,
    staleTime: 2 * 60 * 1000,
  })
}

export function useCommits(
  owner: string,
  repo: string,
  since?: string,
) {
  const { githubToken } = useAuth()

  return useQuery({
    queryKey: ['github', 'commits', owner, repo, since],
    queryFn: () => fetchCommits(owner, repo, since, githubToken),
    enabled: !!githubToken && !!owner && !!repo,
    staleTime: 2 * 60 * 1000,
  })
}
