import type { MergedPR } from './rewrite'

const API_BASE = import.meta.env.VITE_API_BASE ?? ''

export async function fetchUser(): Promise<{ login: string; avatar_url: string; name: string } | null> {
  try {
    const res = await fetch(`${API_BASE}/api/github/user`, { credentials: 'include' })
    if (!res.ok) return null
    return res.json()
  } catch {
    return null
  }
}

export async function fetchMergedPRs(days: number): Promise<MergedPR[]> {
  const res = await fetch(`${API_BASE}/api/github/prs?days=${days}`, { credentials: 'include' })
  if (!res.ok) throw new Error('Failed to fetch PRs')
  return res.json()
}

export function getLoginUrl(): string {
  return `${API_BASE}/api/auth/login`
}

export function getLogoutUrl(): string {
  return `${API_BASE}/api/auth/logout`
}
