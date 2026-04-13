import type Database from 'better-sqlite3'
import { EventStore } from '../db/events'
import { ulid } from 'ulid'
import { app } from 'electron'
import { join } from 'path'
import { mkdirSync, writeFileSync } from 'fs'
import { discoverFigmaFilesFromBrowsers } from './figma-discovery'

interface FigmaVersion {
  id: string
  created_at: string
  label: string
  description: string
  user: { handle: string; img_url: string }
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
    // Poll immediately, then on interval
    this.fullPoll()
    this.timer = setInterval(() => this.fullPoll(), this.pollInterval)
  }

  stop() {
    if (this.timer) { clearInterval(this.timer); this.timer = null }
  }

  /** Called when user saves a new token — re-discover and poll immediately */
  async onTokenChanged() {
    console.log('[FigmaWatcher] Token changed, re-discovering files...')
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

  /** Discover files from browser history + validate with Figma API */
  private async discoverAndRegisterFiles() {
    const token = this.getToken()
    if (!token) return

    try {
      // Verify token
      const meRes = await fetch('https://api.figma.com/v1/me', {
        headers: { 'X-Figma-Token': token },
      })
      if (!meRes.ok) {
        console.log('[FigmaWatcher] Invalid token (status', meRes.status, ')')
        return
      }
      const me = await meRes.json()
      console.log(`[FigmaWatcher] Authenticated as: ${me.handle ?? me.email}`)

      // 1. Discover file keys from browser history (zero config)
      const browserFiles = discoverFigmaFilesFromBrowsers()

      // 2. For each discovered key, verify access + get file name via API
      let registered = 0
      for (const { key } of browserFiles) {
        // Skip if already registered
        const existing = this.db.prepare(
          "SELECT id FROM projects WHERE type = 'figma_file' AND identifier = ?"
        ).get(key)
        if (existing) continue

        // Validate access with the token
        try {
          const fileRes = await fetch(`https://api.figma.com/v1/files/${key}?depth=1`, {
            headers: { 'X-Figma-Token': token },
          })
          if (!fileRes.ok) continue // No access — skip silently
          const fileData = await fileRes.json()
          this.registerFigmaFile(key, fileData.name ?? `Figma: ${key.slice(0, 12)}`)
          registered++
        } catch {
          // Network error — skip
        }
      }

      if (registered > 0) {
        console.log(`[FigmaWatcher] Registered ${registered} new Figma files`)
      }
    } catch (err) {
      console.log('[FigmaWatcher] Discovery error:', err)
    }
  }

  private registerFigmaFile(fileKey: string, fileName: string) {
    const existing = this.db.prepare(
      "SELECT id FROM projects WHERE type = 'figma_file' AND identifier = ?"
    ).get(fileKey)

    if (!existing) {
      const id = ulid()
      this.db.prepare(`
        INSERT INTO projects (id, name, type, identifier, config)
        VALUES (?, ?, 'figma_file', ?, ?)
      `).run(id, fileName || `Figma: ${fileKey.slice(0, 12)}`, fileKey, JSON.stringify({ autoDiscovered: true }))
      console.log(`[FigmaWatcher] Registered: ${fileName}`)
    }
  }

  /** Poll all registered Figma files for changes */
  private async pollAllFiles() {
    const token = this.getToken()
    if (!token) return

    const projects = this.db
      .prepare("SELECT * FROM projects WHERE type = 'figma_file'")
      .all() as Array<{ id: string; identifier: string; name: string }>

    for (const project of projects) {
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
      if (lastKnown && lastKnown === data.lastModified) return

      this.lastModifiedMap.set(fileKey, data.lastModified)
      if (!lastKnown) return // First poll — baseline only

      // Fetch version history
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
          actor: version.user.handle,
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
        console.log(`[FigmaWatcher] ${fileName}: ${newVersions.length} new versions`)
      }
    } catch (err) {
      console.error(`[FigmaWatcher] Error polling ${fileKey}:`, err)
    }
  }
}
