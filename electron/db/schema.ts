import Database from 'better-sqlite3'
import { app } from 'electron'
import { join } from 'path'
import { mkdirSync } from 'fs'

let db: Database.Database | null = null

const SCHEMA_SQL = `
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

CREATE TABLE IF NOT EXISTS projects (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  type        TEXT NOT NULL CHECK(type IN ('figma_file', 'git_repo')),
  identifier  TEXT NOT NULL,
  config      TEXT,
  created_at  TEXT DEFAULT (datetime('now'))
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

-- App config (single row)
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

  const dbPath = join(dbDir, 'designship.db')
  db = new Database(dbPath)

  // Enable WAL mode for better concurrent read/write
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')

  // Run schema
  db.exec(SCHEMA_SQL)

  return db
}

export function getDatabase(): Database.Database {
  if (!db) throw new Error('Database not initialized. Call initDatabase() first.')
  return db
}
