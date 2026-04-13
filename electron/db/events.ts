import type Database from 'better-sqlite3'
import { ulid } from 'ulid'
import type { DSEvent, EventFilters, EventLink } from '../../shared/ipc-types'

export class EventStore {
  constructor(private db: Database.Database) {}

  insert(event: Omit<DSEvent, 'id' | 'created_at'>): DSEvent {
    const id = ulid()
    const stmt = this.db.prepare(`
      INSERT INTO events (id, timestamp, source, type, title, body, actor, project_id, metadata)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    stmt.run(
      id,
      event.timestamp,
      event.source,
      event.type,
      event.title,
      event.body,
      event.actor,
      event.project_id,
      event.metadata ? JSON.stringify(event.metadata) : null,
    )
    return this.get(id)!
  }

  get(id: string): DSEvent | null {
    const row = this.db.prepare('SELECT * FROM events WHERE id = ?').get(id) as RawEvent | undefined
    return row ? mapEvent(row) : null
  }

  list(filters: EventFilters = {}): DSEvent[] {
    const conditions: string[] = []
    const params: unknown[] = []

    if (filters.source) {
      conditions.push('source = ?')
      params.push(filters.source)
    }
    if (filters.project_id) {
      conditions.push('project_id = ?')
      params.push(filters.project_id)
    }
    if (filters.actor) {
      conditions.push('actor = ?')
      params.push(filters.actor)
    }
    if (filters.from) {
      conditions.push('timestamp >= ?')
      params.push(filters.from)
    }
    if (filters.to) {
      conditions.push('timestamp <= ?')
      params.push(filters.to)
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''
    const limit = filters.limit ?? 100
    const offset = filters.offset ?? 0

    const rows = this.db
      .prepare(`SELECT * FROM events ${where} ORDER BY timestamp DESC LIMIT ? OFFSET ?`)
      .all(...params, limit, offset) as RawEvent[]

    return rows.map(mapEvent)
  }

  count(filters: EventFilters = {}): number {
    const conditions: string[] = []
    const params: unknown[] = []

    if (filters.source) { conditions.push('source = ?'); params.push(filters.source) }
    if (filters.project_id) { conditions.push('project_id = ?'); params.push(filters.project_id) }
    if (filters.from) { conditions.push('timestamp >= ?'); params.push(filters.from) }
    if (filters.to) { conditions.push('timestamp <= ?'); params.push(filters.to) }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''
    const row = this.db.prepare(`SELECT COUNT(*) as count FROM events ${where}`).get(...params) as { count: number }
    return row.count
  }

  linkEvents(sourceEventId: string, targetEventId: string, linkType: EventLink['link_type']): void {
    const id = ulid()
    this.db.prepare(`
      INSERT OR IGNORE INTO event_links (id, source_event_id, target_event_id, link_type)
      VALUES (?, ?, ?, ?)
    `).run(id, sourceEventId, targetEventId, linkType)
  }

  getLinkedEvents(eventId: string): DSEvent[] {
    const rows = this.db.prepare(`
      SELECT e.* FROM events e
      JOIN event_links el ON (el.target_event_id = e.id OR el.source_event_id = e.id)
      WHERE (el.source_event_id = ? OR el.target_event_id = ?) AND e.id != ?
    `).all(eventId, eventId, eventId) as RawEvent[]
    return rows.map(mapEvent)
  }

  /** Check if an event with this exact source+type+title+timestamp already exists */
  exists(source: string, type: string, identifier: string): boolean {
    const row = this.db.prepare(
      `SELECT 1 FROM events WHERE source = ? AND type = ? AND metadata LIKE ? LIMIT 1`
    ).get(source, type, `%${identifier}%`)
    return !!row
  }
}

interface RawEvent {
  id: string
  timestamp: string
  source: string
  type: string
  title: string
  body: string | null
  actor: string | null
  project_id: string | null
  metadata: string | null
  created_at: string
}

function mapEvent(row: RawEvent): DSEvent {
  return {
    ...row,
    source: row.source as DSEvent['source'],
    type: row.type as DSEvent['type'],
    metadata: row.metadata ? JSON.parse(row.metadata) : null,
  }
}
