import type Database from 'better-sqlite3'
import { EventStore } from '../db/events'
import { ulid } from 'ulid'
import { app } from 'electron'
import { join } from 'path'
import { mkdirSync } from 'fs'
import { discoverFigmaFilesFromBrowsers } from './figma-discovery'

interface FigmaVersion {
  id: string
  created_at: string
  label: string
  description: string
  user: { handle: string; img_url: string }
}

interface FigmaProject {
  id: string
  identifier: string
  name: string
  config: string | null
}

export class FigmaWatcher {
  private timer: ReturnType<typeof setInterval> | null = null
  private events: EventStore
  private lastModifiedMap = new Map<string, string>()
  private snapshotDir: string

  constructor(
    private db: Database.Database,
    private pollInterval = 15 * 60 * 1000,
  ) {
    this.events = new EventStore(db)
    this.snapshotDir = join(app.getPath('userData'), 'snapshots')
    mkdirSync(this.snapshotDir, { recursive: true })
  }

  start() {
    this.fullPoll()
    this.timer = setInterval(() => this.fullPoll(), this.pollInterval)
  }

  stop() {
    if (this.timer) { clearInterval(this.timer); this.timer = null }
  }

  async onTokenChanged() {
    console.log('[Figma] Token updated — re-discovering files...')
    await this.discoverAndRegisterFiles()
    await this.pollAllFiles()
  }

  private getToken(): string | null {
    const row = this.db
      .prepare("SELECT value FROM app_config WHERE key = 'figma_token'")
      .get() as { value: string } | undefined
    return row?.value || null
  }

  private async fullPoll() {
    const token = this.getToken()
    if (!token) return
    await this.discoverAndRegisterFiles()
    await this.pollAllFiles()
  }

  // ── Discovery ──────────────────────────────────────────────

  private async discoverAndRegisterFiles() {
    const token = this.getToken()
    if (!token) return

    try {
      const meRes = await fetch('https://api.figma.com/v1/me', {
        headers: { 'X-Figma-Token': token },
      })
      if (!meRes.ok) {
        console.log('[Figma] Token invalid (HTTP', meRes.status, ')')
        return
      }
      const me = await meRes.json()
      console.log(`[Figma] Authenticated: ${me.handle} (${me.email})`)

      // Discover from browser history
      const browserFiles = discoverFigmaFilesFromBrowsers()
      let registered = 0
      let skipped = 0
      let noAccess = 0

      for (const { key } of browserFiles) {
        const existing = this.db.prepare(
          "SELECT id FROM projects WHERE type = 'figma_file' AND identifier = ?"
        ).get(key)
        if (existing) { skipped++; continue }

        try {
          const fileRes = await fetch(`https://api.figma.com/v1/files/${key}?depth=1`, {
            headers: { 'X-Figma-Token': token },
          })
          if (!fileRes.ok) {
            noAccess++
            console.log(`[Figma] No access to file ${key} (HTTP ${fileRes.status})`)
            continue
          }
          const fileData = await fileRes.json()
          const fileName = fileData.name ?? `Figma: ${key.slice(0, 12)}`
          this.registerFile(key, fileName)
          registered++

          // Import version history immediately
          await this.importVersionHistory(key, fileName, token)
        } catch (err) {
          console.log(`[Figma] Error checking file ${key}:`, err)
        }
      }

      console.log(`[Figma] Discovery: ${registered} new, ${skipped} existing, ${noAccess} no access`)
    } catch (err) {
      console.log('[Figma] Discovery error:', err)
    }
  }

  private registerFile(fileKey: string, fileName: string): string {
    const existing = this.db.prepare(
      "SELECT id FROM projects WHERE type = 'figma_file' AND identifier = ?"
    ).get(fileKey) as { id: string } | undefined

    if (existing) return existing.id

    const id = ulid()
    this.db.prepare(`
      INSERT INTO projects (id, name, type, identifier, config)
      VALUES (?, ?, 'figma_file', ?, ?)
    `).run(id, fileName, fileKey, JSON.stringify({ autoDiscovered: true, enabled: true }))
    console.log(`[Figma] Registered: ${fileName} (${fileKey.slice(0, 8)}...)`)
    return id
  }

  // ── Import version history (first time) ────────────────────

  private async importVersionHistory(fileKey: string, fileName: string, token: string) {
    const project = this.db.prepare(
      "SELECT id FROM projects WHERE type = 'figma_file' AND identifier = ?"
    ).get(fileKey) as { id: string } | undefined
    if (!project) return

    // Check if we already have events for this file
    const existingCount = this.db.prepare(
      "SELECT COUNT(*) as c FROM events WHERE project_id = ? AND source = 'figma'"
    ).get(project.id) as { c: number }
    if (existingCount.c > 0) return // Already imported

    try {
      const versRes = await fetch(`https://api.figma.com/v1/files/${fileKey}/versions`, {
        headers: { 'X-Figma-Token': token },
      })
      if (!versRes.ok) {
        console.log(`[Figma] Can't fetch versions for ${fileName} (HTTP ${versRes.status})`)
        return
      }
      const versData = await versRes.json()
      const versions: FigmaVersion[] = (versData.versions ?? []).slice(0, 20) // Last 20

      let imported = 0
      for (const version of versions) {
        const dedupKey = `figma:${fileKey}:${version.id}`
        if (this.events.exists('figma', 'version_created', dedupKey)) continue

        this.events.insert({
          timestamp: version.created_at,
          source: 'figma',
          type: 'version_created',
          title: version.description || `${fileName} updated`,
          body: version.label || null,
          actor: version.user?.handle ?? 'Unknown',
          project_id: project.id,
          metadata: {
            dedupKey,
            figmaFileKey: fileKey,
            figmaFileName: fileName,
            versionId: version.id,
          },
        })
        imported++
      }

      if (imported > 0) {
        console.log(`[Figma] ${fileName}: imported ${imported} versions from history`)
      }
    } catch (err) {
      console.log(`[Figma] Error importing history for ${fileName}:`, err)
    }
  }

  // ── Polling for new changes ────────────────────────────────

  private async pollAllFiles() {
    const token = this.getToken()
    if (!token) return

    const projects = this.db
      .prepare("SELECT * FROM projects WHERE type = 'figma_file'")
      .all() as FigmaProject[]

    for (const project of projects) {
      // Check if disabled
      const config = project.config ? JSON.parse(project.config) : {}
      if (config.enabled === false) continue

      await this.pollFile(project.identifier, project.id, project.name, token)
    }
  }

  private async pollFile(fileKey: string, projectId: string, fileName: string, token: string) {
    try {
      const res = await fetch(`https://api.figma.com/v1/files/${fileKey}?depth=1`, {
        headers: { 'X-Figma-Token': token },
      })
      if (!res.ok) return
      const data = await res.json()

      const lastKnown = this.lastModifiedMap.get(fileKey)
      this.lastModifiedMap.set(fileKey, data.lastModified)

      if (!lastKnown) return // First poll — baseline set
      if (lastKnown === data.lastModified) return // No changes

      // Fetch new versions
      const versRes = await fetch(`https://api.figma.com/v1/files/${fileKey}/versions`, {
        headers: { 'X-Figma-Token': token },
      })
      if (!versRes.ok) return
      const versData = await versRes.json()
      const versions: FigmaVersion[] = versData.versions ?? []

      const newVersions = versions.filter(
        (v) => new Date(v.created_at) > new Date(lastKnown),
      )

      for (const version of newVersions) {
        const dedupKey = `figma:${fileKey}:${version.id}`
        if (this.events.exists('figma', 'version_created', dedupKey)) continue

        this.events.insert({
          timestamp: version.created_at,
          source: 'figma',
          type: 'version_created',
          title: version.description || `${fileName} updated`,
          body: version.label || null,
          actor: version.user?.handle ?? 'Unknown',
          project_id: projectId,
          metadata: {
            dedupKey,
            figmaFileKey: fileKey,
            figmaFileName: fileName,
            versionId: version.id,
          },
        })
      }

      if (newVersions.length > 0) {
        console.log(`[Figma] ${fileName}: ${newVersions.length} new changes detected`)
      }
    } catch (err) {
      console.error(`[Figma] Poll error for ${fileKey}:`, err)
    }
  }
}
