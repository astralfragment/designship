import type Database from 'better-sqlite3'
import { EventStore } from '../db/events'
import { ulid } from 'ulid'
import { app } from 'electron'
import { join } from 'path'
import { mkdirSync, writeFileSync } from 'fs'

interface FigmaFile {
  key: string
  name: string
  lastModified: string
  version: string
}

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
    private getToken: () => string | null,
    private pollInterval = 15 * 60 * 1000, // 15 min default
  ) {
    this.events = new EventStore(db)
    this.snapshotDir = join(app.getPath('userData'), 'snapshots')
    mkdirSync(this.snapshotDir, { recursive: true })
  }

  start() {
    // Auto-discover Figma files on first start
    this.autoDiscoverFiles().then(() => this.poll())
    this.timer = setInterval(() => this.poll(), this.pollInterval)
  }

  /** Fetch user's recent files and auto-register them as projects */
  private async autoDiscoverFiles() {
    const token = this.getToken()
    if (!token) return

    try {
      const res = await fetch('https://api.figma.com/v1/me', {
        headers: { 'X-Figma-Token': token },
      })
      if (!res.ok) return
      const me = await res.json()
      console.log(`[FigmaWatcher] Connected as ${me.handle ?? me.email ?? 'unknown'}`)

      // Fetch recent files from the user's teams/projects
      // The /v1/me/files endpoint gives recent files
      const filesRes = await fetch('https://api.figma.com/v1/me/files?page_size=10', {
        headers: { 'X-Figma-Token': token },
      })
      // This endpoint may not exist for all accounts, so fail gracefully
      if (!filesRes.ok) {
        console.log('[FigmaWatcher] Could not auto-discover files (API returned', filesRes.status, ')')
        return
      }

      const filesData = await filesRes.json()
      const files = filesData.files ?? filesData.meta?.files ?? []

      for (const file of files) {
        const fileKey = file.key
        if (!fileKey) continue

        const existing = this.db.prepare(
          "SELECT id FROM projects WHERE type = 'figma_file' AND identifier = ?"
        ).get(fileKey)

        if (!existing) {
          const id = ulid()
          this.db.prepare(`
            INSERT INTO projects (id, name, type, identifier, config)
            VALUES (?, ?, 'figma_file', ?, ?)
          `).run(id, file.name || `Figma: ${fileKey.slice(0, 8)}`, fileKey, JSON.stringify({ autoDiscovered: true }))
          console.log(`[FigmaWatcher] Auto-registered: ${file.name}`)
        }
      }
    } catch (err) {
      console.log('[FigmaWatcher] Auto-discover error:', err)
    }
  }

  stop() {
    if (this.timer) {
      clearInterval(this.timer)
      this.timer = null
    }
  }

  async pollFile(fileKey: string, projectId: string): Promise<void> {
    const token = this.getToken()
    if (!token) return

    try {
      // 1. Check if file was modified
      const file = await this.fetchFile(fileKey, token)
      if (!file) return

      const lastKnown = this.lastModifiedMap.get(fileKey)
      if (lastKnown && lastKnown === file.lastModified) return

      this.lastModifiedMap.set(fileKey, file.lastModified)
      if (!lastKnown) return // First poll — just record baseline

      // 2. Fetch version history to see what changed
      const versions = await this.fetchVersions(fileKey, token)
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
          title: version.description || `${file.name} updated`,
          body: version.label || null,
          actor: version.user.handle,
          project_id: projectId,
          metadata: {
            dedupKey,
            figmaFileKey: fileKey,
            figmaFileName: file.name,
            versionId: version.id,
            versionDescription: version.description,
          },
        })
      }

      // 3. Try to capture a snapshot of the first page
      await this.captureSnapshot(fileKey, token)
    } catch (err) {
      console.error(`[FigmaWatcher] Error polling ${fileKey}:`, err)
    }
  }

  private async poll() {
    const projects = this.db
      .prepare("SELECT * FROM projects WHERE type = 'figma_file'")
      .all() as Array<{ id: string; identifier: string }>

    for (const project of projects) {
      await this.pollFile(project.identifier, project.id)
    }
  }

  private async fetchFile(fileKey: string, token: string): Promise<FigmaFile | null> {
    const res = await fetch(`https://api.figma.com/v1/files/${fileKey}?depth=1`, {
      headers: { 'X-Figma-Token': token },
    })
    if (!res.ok) return null
    const data = await res.json()
    return {
      key: fileKey,
      name: data.name,
      lastModified: data.lastModified,
      version: data.version,
    }
  }

  private async fetchVersions(fileKey: string, token: string): Promise<FigmaVersion[]> {
    const res = await fetch(`https://api.figma.com/v1/files/${fileKey}/versions`, {
      headers: { 'X-Figma-Token': token },
    })
    if (!res.ok) return []
    const data = await res.json()
    return data.versions ?? []
  }

  private async captureSnapshot(fileKey: string, token: string): Promise<string | null> {
    try {
      // Get the first page's node ID
      const res = await fetch(`https://api.figma.com/v1/files/${fileKey}?depth=1`, {
        headers: { 'X-Figma-Token': token },
      })
      if (!res.ok) return null
      const data = await res.json()
      const firstPage = data.document?.children?.[0]
      if (!firstPage) return null

      // Render as image
      const imgRes = await fetch(
        `https://api.figma.com/v1/images/${fileKey}?ids=${firstPage.id}&format=png&scale=1`,
        { headers: { 'X-Figma-Token': token } },
      )
      if (!imgRes.ok) return null
      const imgData = await imgRes.json()
      const imageUrl = imgData.images?.[firstPage.id]
      if (!imageUrl) return null

      // Download and save
      const pngRes = await fetch(imageUrl)
      const buffer = Buffer.from(await pngRes.arrayBuffer())
      const filename = `${fileKey}-${Date.now()}.png`
      const filepath = join(this.snapshotDir, filename)
      writeFileSync(filepath, buffer)

      return filepath
    } catch {
      return null
    }
  }
}
