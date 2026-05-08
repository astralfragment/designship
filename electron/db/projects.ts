import type Database from 'better-sqlite3'
import { ulid } from 'ulid'
import type { Project } from '../../shared/ipc-types'

interface RawProject {
  id: string
  name: string
  type: string
  identifier: string
  config: string | null
  created_at: string
}

function mapProject(row: RawProject): Project {
  return {
    ...row,
    config: row.config ? JSON.parse(row.config) : null,
  }
}

export class ProjectStore {
  constructor(private db: Database.Database) {}

  list(): Project[] {
    const rows = this.db
      .prepare(`SELECT * FROM projects WHERE type = 'fragment_workspace' ORDER BY created_at ASC`)
      .all() as RawProject[]
    return rows.map(mapProject)
  }

  get(id: string): Project | null {
    const row = this.db.prepare('SELECT * FROM projects WHERE id = ?').get(id) as
      | RawProject
      | undefined
    return row ? mapProject(row) : null
  }

  findByName(name: string): Project | null {
    const row = this.db
      .prepare(`SELECT * FROM projects WHERE name = ? AND type = 'fragment_workspace' LIMIT 1`)
      .get(name) as RawProject | undefined
    return row ? mapProject(row) : null
  }

  create(name: string): Project {
    const id = ulid()
    this.db
      .prepare(
        `INSERT INTO projects (id, name, type, identifier) VALUES (?, ?, 'fragment_workspace', ?)`,
      )
      .run(id, name, id)
    return this.get(id)!
  }

  rename(id: string, name: string): Project {
    this.db.prepare('UPDATE projects SET name = ? WHERE id = ?').run(name, id)
    return this.get(id)!
  }

  remove(id: string): void {
    // Cascade-ish: clean up dependent rows manually since we did not declare ON DELETE
    this.db.prepare('DELETE FROM specs WHERE project_id = ?').run(id)
    this.db.prepare('DELETE FROM decisions WHERE project_id = ?').run(id)
    this.db
      .prepare(
        `DELETE FROM fragment_links WHERE fragment_id IN (SELECT id FROM fragments WHERE project_id = ?)`,
      )
      .run(id)
    this.db.prepare('DELETE FROM fragments WHERE project_id = ?').run(id)
    this.db.prepare('DELETE FROM context_groups WHERE project_id = ?').run(id)
    this.db.prepare('DELETE FROM projects WHERE id = ?').run(id)
  }
}
