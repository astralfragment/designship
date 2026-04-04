import { useQuery, useInfiniteQuery } from '@tanstack/react-query'
import { useAuth } from '@/lib/auth'
import {
  fetchUserRepos,
  fetchMergedPRs,
  fetchMergedPRsPage,
  fetchCommits,
} from '@/lib/github'
import type { PRPage } from '@/lib/github'

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

export function useMergedPRsPaginated(owner: string, repo: string) {
  const { githubToken } = useAuth()

  return useInfiniteQuery<PRPage>({
    queryKey: ['github', 'prs-paginated', owner, repo],
    queryFn: ({ pageParam }) =>
      fetchMergedPRsPage(owner, repo, pageParam as number, githubToken),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => lastPage.nextPage,
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
