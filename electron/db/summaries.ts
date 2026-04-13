import type Database from 'better-sqlite3'
import { ulid } from 'ulid'
import type { Summary, SummaryType } from '../../shared/ipc-types'

export class SummaryStore {
  constructor(private db: Database.Database) {}

  insert(summary: {
    type: SummaryType
    period_start: string
    period_end: string
    content: string
    model_used?: string
    event_ids?: string[]
  }): Summary {
    const id = ulid()
    this.db.prepare(`
      INSERT INTO summaries (id, type, period_start, period_end, content, model_used, event_ids)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      summary.type,
      summary.period_start,
      summary.period_end,
      summary.content,
      summary.model_used ?? null,
      summary.event_ids ? JSON.stringify(summary.event_ids) : null,
    )
    return this.get(id)!
  }

  get(id: string): Summary | null {
    const row = this.db.prepare('SELECT * FROM summaries WHERE id = ?').get(id) as RawSummary | undefined
    return row ? mapSummary(row) : null
  }

  list(limit = 50): Summary[] {
    const rows = this.db.prepare(
      'SELECT * FROM summaries ORDER BY created_at DESC LIMIT ?'
    ).all(limit) as RawSummary[]
    return rows.map(mapSummary)
  }
}

interface RawSummary {
  id: string
  type: string
  period_start: string
  period_end: string
  content: string
  model_used: string | null
  event_ids: string | null
  created_at: string
}

function mapSummary(row: RawSummary): Summary {
  return {
    ...row,
    type: row.type as SummaryType,
    event_ids: row.event_ids ? JSON.parse(row.event_ids) : null,
  }
}
