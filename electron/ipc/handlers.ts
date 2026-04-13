import { ipcMain, dialog, BrowserWindow } from 'electron'
import type Database from 'better-sqlite3'
import { ulid } from 'ulid'
import { EventStore } from '../db/events'
import { SummaryStore } from '../db/summaries'
import { generateTemplateSummary } from '../ai/templates'
import { generateAISummary } from '../ai/summariser'
import type { AppConfig, AIProviderConfig, SummaryOptions } from '../../shared/ipc-types'
import simpleGit from 'simple-git'
import { basename } from 'path'

export function registerIPCHandlers(db: Database.Database) {
  const events = new EventStore(db)
  const summaries = new SummaryStore(db)

  // --- Events ---
  ipcMain.handle('events:list', (_e, filters) => events.list(filters))
  ipcMain.handle('events:get', (_e, id) => events.get(id))
  ipcMain.handle('events:count', (_e, filters) => events.count(filters))

  // --- Projects ---
  ipcMain.handle('projects:list', () => {
    return db.prepare('SELECT * FROM projects ORDER BY created_at DESC').all()
  })

  ipcMain.handle('projects:add-figma', (_e, fileUrl: string) => {
    // Extract file key from URL: https://figma.com/file/XXXXX/...
    const match = fileUrl.match(/figma\.com\/(?:file|design|proto)\/([a-zA-Z0-9]+)/)
    const fileKey = match?.[1] ?? fileUrl // Allow raw file key too
    const id = ulid()
    db.prepare(`
      INSERT INTO projects (id, name, type, identifier)
      VALUES (?, ?, 'figma_file', ?)
    `).run(id, `Figma: ${fileKey.slice(0, 12)}...`, fileKey)
    return db.prepare('SELECT * FROM projects WHERE id = ?').get(id)
  })

  ipcMain.handle('projects:add-git', (_e, repoPath: string) => {
    const id = ulid()
    const name = basename(repoPath)
    db.prepare(`
      INSERT INTO projects (id, name, type, identifier)
      VALUES (?, ?, 'git_repo', ?)
    `).run(id, name, repoPath)
    return db.prepare('SELECT * FROM projects WHERE id = ?').get(id)
  })

  ipcMain.handle('projects:remove', (_e, id: string) => {
    db.prepare('DELETE FROM events WHERE project_id = ?').run(id)
    db.prepare('DELETE FROM projects WHERE id = ?').run(id)
  })

  // --- Git ---
  ipcMain.handle('git:browse-repo', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory'],
      title: 'Select a Git repository',
    })
    return result.canceled ? null : result.filePaths[0] ?? null
  })

  ipcMain.handle('git:get-info', async (_e, path: string) => {
    try {
      const git = simpleGit(path)
      const isRepo = await git.checkIsRepo()
      if (!isRepo) return null
      const branch = await git.branch()
      const remotes = await git.getRemotes(true)
      return {
        path,
        name: basename(path),
        currentBranch: branch.current,
        remoteUrl: remotes[0]?.refs?.fetch ?? null,
      }
    } catch {
      return null
    }
  })

  // --- Figma ---
  ipcMain.handle('figma:set-token', (_e, token: string) => {
    db.prepare(`
      INSERT OR REPLACE INTO app_config (key, value) VALUES ('figma_token', ?)
    `).run(token)
    return true
  })

  ipcMain.handle('figma:get-snapshot', (_e, eventId: string) => {
    const snap = db.prepare('SELECT file_path FROM snapshots WHERE event_id = ?').get(eventId) as { file_path: string } | undefined
    return snap?.file_path ?? null
  })

  // --- Summaries ---
  ipcMain.handle('summary:generate', async (_e, opts: SummaryOptions) => {
    const periodEvents = events.list({
      from: opts.period_start,
      to: opts.period_end,
      limit: 500,
    })

    let content: string
    let modelUsed: string | null = null

    if (opts.use_ai) {
      const aiConfig = getAIConfig(db)
      const result = await generateAISummary(periodEvents, opts.type, aiConfig)
      content = result.content
      modelUsed = result.model
    } else {
      content = generateTemplateSummary(periodEvents, opts.type)
    }

    const summary = summaries.insert({
      type: opts.type,
      period_start: opts.period_start,
      period_end: opts.period_end,
      content,
      model_used: modelUsed,
      event_ids: periodEvents.map((e) => e.id),
    })

    return summary.content
  })

  ipcMain.handle('summary:list', () => summaries.list())
  ipcMain.handle('summary:get', (_e, id) => summaries.get(id))

  // --- Config ---
  ipcMain.handle('config:get', () => {
    const figmaToken = getConfigValue(db, 'figma_token')
    const pollInterval = parseInt(getConfigValue(db, 'figma_poll_interval') ?? '900000', 10)
    const aiProvider = getAIConfig(db)
    return {
      figmaToken,
      figmaPollInterval: pollInterval,
      aiProvider,
      theme: 'dark',
    } satisfies AppConfig
  })

  ipcMain.handle('config:set', (_e, config: Partial<AppConfig>) => {
    if (config.figmaToken !== undefined) {
      setConfigValue(db, 'figma_token', config.figmaToken ?? '')
    }
    if (config.figmaPollInterval !== undefined) {
      setConfigValue(db, 'figma_poll_interval', String(config.figmaPollInterval))
    }
  })

  ipcMain.handle('config:set-ai', (_e, config: AIProviderConfig) => {
    setConfigValue(db, 'ai_provider', config.provider)
    if (config.apiKey) setConfigValue(db, 'ai_api_key', config.apiKey)
    if (config.ollamaBaseUrl) setConfigValue(db, 'ai_ollama_url', config.ollamaBaseUrl)
    if (config.ollamaModel) setConfigValue(db, 'ai_ollama_model', config.ollamaModel)
  })

  // --- Window controls ---
  ipcMain.on('window:minimize', (e) => {
    BrowserWindow.fromWebContents(e.sender)?.minimize()
  })
  ipcMain.on('window:maximize', (e) => {
    const win = BrowserWindow.fromWebContents(e.sender)
    if (win?.isMaximized()) win.unmaximize()
    else win?.maximize()
  })
  ipcMain.on('window:close', (e) => {
    BrowserWindow.fromWebContents(e.sender)?.hide()
  })
}

function getConfigValue(db: Database.Database, key: string): string | null {
  const row = db.prepare('SELECT value FROM app_config WHERE key = ?').get(key) as { value: string } | undefined
  return row?.value ?? null
}

function setConfigValue(db: Database.Database, key: string, value: string) {
  db.prepare('INSERT OR REPLACE INTO app_config (key, value) VALUES (?, ?)').run(key, value)
}

function getAIConfig(db: Database.Database): AIProviderConfig {
  return {
    provider: (getConfigValue(db, 'ai_provider') as 'claude' | 'ollama' | 'none') ?? 'none',
    apiKey: getConfigValue(db, 'ai_api_key') ?? undefined,
    ollamaBaseUrl: getConfigValue(db, 'ai_ollama_url') ?? 'http://localhost:11434',
    ollamaModel: getConfigValue(db, 'ai_ollama_model') ?? 'qwen2.5-coder:14b',
  }
}
