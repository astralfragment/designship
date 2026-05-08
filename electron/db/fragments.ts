import type Database from 'better-sqlite3'
import { ulid } from 'ulid'
import type {
  Fragment,
  FragmentInput,
  FragmentFilters,
  FragmentType,
} from '../../shared/ipc-types'

interface RawFragment {
  id: string
  project_id: string
  title: string
  content: string
  type: string
  source: string | null
  tags: string
  created_at: string
  updated_at: string
}

function mapFragment(row: RawFragment): Fragment {
  let tags: string[] = []
  try {
    tags = JSON.parse(row.tags)
  } catch {
    tags = []
  }
  return {
    ...row,
    type: row.type as FragmentType,
    tags,
  }
}

export class FragmentStore {
  constructor(private db: Database.Database) {}

  insert(input: FragmentInput): Fragment {
    const id = ulid()
    const tags = JSON.stringify(input.tags ?? [])
    this.db
      .prepare(
        `INSERT INTO fragments (id, project_id, title, content, type, source, tags)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        id,
        input.project_id,
        input.title,
        input.content ?? '',
        input.type ?? 'note',
        input.source ?? null,
        tags,
      )
    return this.get(id)!
  }

  get(id: string): Fragment | null {
    const row = this.db.prepare('SELECT * FROM fragments WHERE id = ?').get(id) as
      | RawFragment
      | undefined
    return row ? mapFragment(row) : null
  }

  list(filters: FragmentFilters = {}): Fragment[] {
    const conditions: string[] = []
    const params: unknown[] = []

    if (filters.project_id) {
      conditions.push('project_id = ?')
      params.push(filters.project_id)
    }
    if (filters.type) {
      conditions.push('type = ?')
      params.push(filters.type)
    }
    if (filters.search) {
      conditions.push('(title LIKE ? OR content LIKE ?)')
      const term = `%${filters.search}%`
      params.push(term, term)
    }
    if (filters.tag) {
      conditions.push('tags LIKE ?')
      params.push(`%"${filters.tag}"%`)
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''
    const limit = filters.limit ?? 500

    const rows = this.db
      .prepare(`SELECT * FROM fragments ${where} ORDER BY updated_at DESC LIMIT ?`)
      .all(...params, limit) as RawFragment[]
    return rows.map(mapFragment)
  }

  update(id: string, patch: Partial<FragmentInput>): Fragment {
    const existing = this.get(id)
    if (!existing) throw new Error(`Fragment ${id} not found`)

    const next = {
      title: patch.title ?? existing.title,
      content: patch.content ?? existing.content,
      type: patch.type ?? existing.type,
      source: patch.source ?? existing.source,
      tags: JSON.stringify(patch.tags ?? existing.tags),
    }

    this.db
      .prepare(
        `UPDATE fragments
         SET title = ?, content = ?, type = ?, source = ?, tags = ?, updated_at = datetime('now')
         WHERE id = ?`,
      )
      .run(next.title, next.content, next.type, next.source, next.tags, id)

    return this.get(id)!
  }

  delete(id: string): void {
    this.db.prepare('DELETE FROM fragments WHERE id = ?').run(id)
  }

  getMany(ids: string[]): Fragment[] {
    if (ids.length === 0) return []
    const placeholders = ids.map(() => '?').join(',')
    const rows = this.db
      .prepare(`SELECT * FROM fragments WHERE id IN (${placeholders})`)
      .all(...ids) as RawFragment[]
    return rows.map(mapFragment)
  }
}
