import { supabase } from './supabase'
import type { WeeklySummary } from './ai'

export interface StoredSummary {
  id: string
  user_id: string
  date_from: string
  date_to: string
  shipped: string[]
  in_progress: string[]
  key_decisions: string[]
  repo_name: string | null
  generated_at: string
  created_at: string
}

export async function saveSummary(
  summary: WeeklySummary,
  repoName?: string,
): Promise<StoredSummary> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('summaries')
    .insert({
      user_id: user.id,
      date_from: summary.dateRange.from,
      date_to: summary.dateRange.to,
      shipped: summary.shipped,
      in_progress: summary.inProgress,
      key_decisions: summary.keyDecisions,
      repo_name: repoName ?? null,
      generated_at: summary.generatedAt,
    })
    .select()
    .single()

  if (error) throw error
  return data as StoredSummary
}

export async function fetchSummaries(): Promise<StoredSummary[]> {
  const { data, error } = await supabase
    .from('summaries')
    .select('*')
    .order('generated_at', { ascending: false })

  if (error) throw error
  return (data ?? []) as StoredSummary[]
}

export async function deleteSummary(id: string): Promise<void> {
  const { error } = await supabase.from('summaries').delete().eq('id', id)
  if (error) throw error
}

export function storedToWeeklySummary(stored: StoredSummary): WeeklySummary {
  return {
    shipped: stored.shipped,
    inProgress: stored.in_progress,
    keyDecisions: stored.key_decisions,
    dateRange: { from: stored.date_from, to: stored.date_to },
    generatedAt: stored.generated_at,
  }
}
