import { GITHUB_TOKEN_KEY } from './auth'

const GITHUB_API = 'https://api.github.com'

function getToken(): string | null {
  return typeof window !== 'undefined'
    ? localStorage.getItem(GITHUB_TOKEN_KEY)
    : null
}

interface GitHubRequestOptions {
  token?: string | null
  params?: Record<string, string | number>
}

class GitHubRateLimitError extends Error {
  resetAt: Date
  constructor(resetAt: Date) {
    super(`GitHub API rate limit exceeded. Resets at ${resetAt.toISOString()}`)
    this.name = 'GitHubRateLimitError'
    this.resetAt = resetAt
  }
}

class GitHubAuthError extends Error {
  constructor() {
    super('GitHub authentication failed. Please sign in again.')
    this.name = 'GitHubAuthError'
  }
}

async function githubFetch<T>(
  path: string,
  options: GitHubRequestOptions = {},
): Promise<T> {
  const token = options.token ?? getToken()
  if (!token) throw new GitHubAuthError()

  const url = new URL(`${GITHUB_API}${path}`)
  if (options.params) {
    for (const [key, value] of Object.entries(options.params)) {
      url.searchParams.set(key, String(value))
    }
  }

  const res = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
  })

  if (res.status === 401) {
    throw new GitHubAuthError()
  }

  if (res.status === 403) {
    const rateLimitRemaining = res.headers.get('x-ratelimit-remaining')
    if (rateLimitRemaining === '0') {
      const resetEpoch = Number(res.headers.get('x-ratelimit-reset')) * 1000
      throw new GitHubRateLimitError(new Date(resetEpoch))
    }
    const retryAfter = res.headers.get('retry-after')
    if (retryAfter) {
      throw new GitHubRateLimitError(new Date(Date.now() + Number(retryAfter) * 1000))
    }
    throw new Error(`GitHub API forbidden: ${res.status}`)
  }

  if (!res.ok) {
    throw new Error(`GitHub API error: ${res.status} ${res.statusText}`)
  }

  return res.json() as Promise<T>
}

// --- Types ---

export interface GitHubRepo {
  id: number
  name: string
  full_name: string
  owner: { login: string; avatar_url: string }
  description: string | null
  private: boolean
  html_url: string
  pushed_at: string
  updated_at: string
  language: string | null
  stargazers_count: number
  default_branch: string
}

export interface GitHubPR {
  id: number
  number: number
  title: string
  body: string | null
  state: string
  html_url: string
  merged_at: string | null
  created_at: string
  updated_at: string
  user: { login: string; avatar_url: string }
  head: { ref: string }
  base: { ref: string }
  changed_files?: number
  additions?: number
  deletions?: number
  review_comments?: number
  labels: Array<{ name: string; color: string }>
}

// --- API Functions ---

export async function fetchUserRepos(
  token?: string | null,
): Promise<GitHubRepo[]> {
  const repos: GitHubRepo[] = []
  let page = 1
  const perPage = 100

  while (true) {
    const batch = await githubFetch<GitHubRepo[]>('/user/repos', {
      token,
      params: {
        sort: 'pushed',
        direction: 'desc',
        per_page: perPage,
        page,
        type: 'all',
      },
    })
    repos.push(...batch)
    if (batch.length < perPage) break
    page++
    // Safety cap: don't fetch more than 500 repos
    if (repos.length >= 500) break
  }

  return repos
}

export interface PRPage {
  prs: GitHubPR[]
  nextPage: number | null
}

const PR_PAGE_SIZE = 15

const GITHUB_NAME_PATTERN = /^[a-zA-Z0-9._-]+$/

export async function fetchMergedPRsPage(
  owner: string,
  repo: string,
  page: number,
  token?: string | null,
): Promise<PRPage> {
  if (!GITHUB_NAME_PATTERN.test(owner) || !GITHUB_NAME_PATTERN.test(repo)) {
    throw new Error('Invalid repository owner or name')
  }

  const batch = await githubFetch<GitHubPR[]>(
    `/repos/${owner}/${repo}/pulls`,
    {
      token,
      params: {
        state: 'closed',
        sort: 'updated',
        direction: 'desc',
        per_page: PR_PAGE_SIZE,
        page,
      },
    },
  )

  const merged = batch.filter((pr) => pr.merged_at !== null)
  const hasMore = batch.length === PR_PAGE_SIZE

  return {
    prs: merged,
    nextPage: hasMore ? page + 1 : null,
  }
}

export { GitHubRateLimitError, GitHubAuthError }
