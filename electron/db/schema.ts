import Database from 'better-sqlite3'
import { app } from 'electron'
import { join } from 'path'
import { mkdirSync } from 'fs'

let db: Database.Database | null = null

const SCHEMA_SQL = `
-- Projects (workspaces). Reused from DesignShip but the type CHECK is dropped
-- so 'fragment_workspace' (Fragment MVP) and 'figma_file'/'git_repo' (parked
-- DesignShip integrations) can coexist.
CREATE TABLE IF NOT EXISTS projects (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  type        TEXT NOT NULL,
  identifier  TEXT NOT NULL,
  config      TEXT,
  created_at  TEXT DEFAULT (datetime('now'))
);

-- ===== Fragment MVP tables =====

CREATE TABLE IF NOT EXISTS fragments (
  id          TEXT PRIMARY KEY,
  project_id  TEXT NOT NULL REFERENCES projects(id),
  title       TEXT NOT NULL,
  content     TEXT NOT NULL DEFAULT '',
  type        TEXT NOT NULL DEFAULT 'note',
  source      TEXT,
  tags        TEXT NOT NULL DEFAULT '[]',
  created_at  TEXT DEFAULT (datetime('now')),
  updated_at  TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS context_groups (
  id          TEXT PRIMARY KEY,
  project_id  TEXT NOT NULL REFERENCES projects(id),
  name        TEXT NOT NULL,
  description TEXT,
  created_at  TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS fragment_links (
  id          TEXT PRIMARY KEY,
  group_id    TEXT NOT NULL REFERENCES context_groups(id),
  fragment_id TEXT NOT NULL REFERENCES fragments(id),
  role        TEXT NOT NULL DEFAULT 'relates_to',
  created_at  TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS decisions (
  id            TEXT PRIMARY KEY,
  project_id    TEXT NOT NULL REFERENCES projects(id),
  title         TEXT NOT NULL,
  rationale     TEXT,
  fragment_ids  TEXT NOT NULL DEFAULT '[]',
  created_at    TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS specs (
  id            TEXT PRIMARY KEY,
  project_id    TEXT NOT NULL REFERENCES projects(id),
  title         TEXT NOT NULL,
  content_md    TEXT NOT NULL DEFAULT '',
  status        TEXT NOT NULL DEFAULT 'draft',
  fragment_ids  TEXT NOT NULL DEFAULT '[]',
  created_at    TEXT DEFAULT (datetime('now')),
  updated_at    TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_fragments_project ON fragments(project_id);
CREATE INDEX IF NOT EXISTS idx_fragments_type ON fragments(type);
CREATE INDEX IF NOT EXISTS idx_fragments_updated ON fragments(updated_at);
CREATE INDEX IF NOT EXISTS idx_specs_project ON specs(project_id);
CREATE INDEX IF NOT EXISTS idx_decisions_project ON decisions(project_id);

-- ===== Parked: DesignShip-era tables (kept so the watcher code still compiles) =====

CREATE TABLE IF NOT EXISTS events (
  id          TEXT PRIMARY KEY,
  timestamp   TEXT NOT NULL,
  source      TEXT NOT NULL CHECK(source IN ('figma', 'git')),
  type        TEXT NOT NULL,
  title       TEXT NOT NULL,
  body        TEXT,
  actor       TEXT,
  project_id  TEXT REFERENCES projects(id),
  metadata    TEXT,
  created_at  TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS event_links (
  id                TEXT PRIMARY KEY,
  source_event_id   TEXT NOT NULL REFERENCES events(id),
  target_event_id   TEXT NOT NULL REFERENCES events(id),
  link_type         TEXT NOT NULL CHECK(link_type IN ('figma_ref', 'implements', 'related')),
  created_at        TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS summaries (
  id            TEXT PRIMARY KEY,
  type          TEXT NOT NULL CHECK(type IN ('weekly', 'changelog', 'standup', 'adhoc')),
  period_start  TEXT NOT NULL,
  period_end    TEXT NOT NULL,
  content       TEXT NOT NULL,
  model_used    TEXT,
  event_ids     TEXT,
  created_at    TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS snapshots (
  id            TEXT PRIMARY KEY,
  event_id      TEXT REFERENCES events(id),
  figma_node_id TEXT,
  file_path     TEXT NOT NULL,
  created_at    TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_events_timestamp ON events(timestamp);
CREATE INDEX IF NOT EXISTS idx_events_source ON events(source);
CREATE INDEX IF NOT EXISTS idx_events_project ON events(project_id);
CREATE INDEX IF NOT EXISTS idx_summaries_type ON summaries(type);

-- App config (single row per key)
CREATE TABLE IF NOT EXISTS app_config (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
`

export function initDatabase(): Database.Database {
  if (db) return db

  const userDataPath = app.getPath('userData')
  const dbDir = join(userDataPath, 'data')
  mkdirSync(dbDir, { recursive: true })

  const dbPath = join(dbDir, 'fragment.db')
  db = new Database(dbPath)

  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')

  db.exec(SCHEMA_SQL)

  return db
}

export function getDatabase(): Database.Database {
  if (!db) throw new Error('Database not initialized. Call initDatabase() first.')
  return db
}
