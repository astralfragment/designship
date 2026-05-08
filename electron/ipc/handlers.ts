import { ipcMain, dialog, BrowserWindow } from 'electron'
import type Database from 'better-sqlite3'
import { writeFileSync } from 'fs'
import { ProjectStore } from '../db/projects'
import { FragmentStore } from '../db/fragments'
import { SpecStore, draftSpecMarkdown } from '../db/specs'
import { seedSampleWorkspace } from '../db/sample-workspace'
import { draftSpecWithAI } from '../ai/spec-drafter'
import type {
  AIProviderConfig,
  AppConfig,
  FragmentInput,
  FragmentFilters,
  SpecDraftOptions,
  SpecUpdateInput,
} from '../../shared/ipc-types'

export function registerIPCHandlers(db: Database.Database) {
  const projects = new ProjectStore(db)
  const fragments = new FragmentStore(db)
  const specs = new SpecStore(db)

  // --- Projects ---
  ipcMain.handle('projects:list', () => projects.list())
  ipcMain.handle('projects:create', (_e, name: string) => projects.create(name))
  ipcMain.handle('projects:rename', (_e, id: string, name: string) =>
    projects.rename(id, name),
  )
  ipcMain.handle('projects:remove', (_e, id: string) => {
    projects.remove(id)
  })

  // --- Fragments ---
  ipcMain.handle('fragments:list', (_e, filters: FragmentFilters) =>
    fragments.list(filters),
  )
  ipcMain.handle('fragments:get', (_e, id: string) => fragments.get(id))
  ipcMain.handle('fragments:add', (_e, input: FragmentInput) =>
    fragments.insert(input),
  )
  ipcMain.handle(
    'fragments:update',
    (_e, id: string, patch: Partial<FragmentInput>) => fragments.update(id, patch),
  )
  ipcMain.handle('fragments:delete', (_e, id: string) => {
    fragments.delete(id)
  })

  // --- Specs ---
  ipcMain.handle('specs:list', (_e, projectId: string) => specs.list(projectId))
  ipcMain.handle('specs:get', (_e, id: string) => specs.get(id))

  ipcMain.handle('specs:draft', async (_e, opts: SpecDraftOptions) => {
    const selected = fragments.getMany(opts.fragment_ids)

    let title: string
    let content: string

    if (opts.use_ai) {
      const aiConfig = getAIConfig(db)
      if (aiConfig.provider === 'none') {
        throw new Error(
          'No AI provider configured. Open Settings → AI assist to add a Claude key or Ollama endpoint.',
        )
      }
      try {
        const aiContent = await draftSpecWithAI(selected, aiConfig, opts.title)
        const headlineMatch = aiContent.match(/^#\s+(.+)$/m)
        title = opts.title ?? headlineMatch?.[1]?.trim() ?? 'Untitled spec'
        content = aiContent
      } catch (err) {
        const fallback = draftSpecMarkdown(selected, opts.title)
        title = fallback.title
        content =
          `_AI draft failed (${err instanceof Error ? err.message : 'unknown'}). Falling back to template draft._\n\n` +
          fallback.content
      }
    } else {
      const drafted = draftSpecMarkdown(selected, opts.title)
      title = drafted.title
      content = drafted.content
    }

    return specs.insert({
      project_id: opts.project_id,
      title,
      content_md: content,
      fragment_ids: opts.fragment_ids,
    })
  })

  ipcMain.handle(
    'specs:update',
    (_e, id: string, patch: SpecUpdateInput) => specs.update(id, patch),
  )
  ipcMain.handle('specs:delete', (_e, id: string) => {
    specs.delete(id)
  })

  ipcMain.handle(
    'specs:export',
    (_e, id: string, format: 'markdown' | 'github') => {
      const spec = specs.get(id)
      if (!spec) throw new Error(`Spec ${id} not found`)
      if (format === 'github') {
        const stripped = spec.content_md.replace(/^#\s+.+\n\n?/m, '')
        return stripped
      }
      return spec.content_md
    },
  )

  ipcMain.handle('specs:save-as', async (_e, id: string) => {
    const spec = specs.get(id)
    if (!spec) throw new Error(`Spec ${id} not found`)
    const safeName = spec.title.replace(/[^a-z0-9-_ ]/gi, '').trim() || 'spec'
    const result = await dialog.showSaveDialog({
      title: 'Save spec as Markdown',
      defaultPath: `${safeName}.md`,
      filters: [{ name: 'Markdown', extensions: ['md'] }],
    })
    if (result.canceled || !result.filePath) return null
    writeFileSync(result.filePath, spec.content_md, 'utf-8')
    return result.filePath
  })

  // --- Sample data ---
  ipcMain.handle('seed:samples', () => seedSampleWorkspace(db))
  ipcMain.handle('seed:reset-welcome-flag', () => {
    db.prepare(`DELETE FROM app_config WHERE key = 'welcome_dismissed'`).run()
  })

  // --- Config ---
  ipcMain.handle('config:get', () => {
    return {
      aiProvider: getAIConfig(db),
      currentProjectId: getConfigValue(db, 'current_project_id'),
    } satisfies AppConfig
  })

  ipcMain.handle('config:set-ai', (_e, config: AIProviderConfig) => {
    setConfigValue(db, 'ai_provider', config.provider)
    if (config.apiKey !== undefined)
      setConfigValue(db, 'ai_api_key', config.apiKey)
    if (config.ollamaBaseUrl !== undefined)
      setConfigValue(db, 'ai_ollama_url', config.ollamaBaseUrl)
    if (config.ollamaModel !== undefined)
      setConfigValue(db, 'ai_ollama_model', config.ollamaModel)
  })

  ipcMain.handle('config:set-current-project', (_e, projectId: string) => {
    setConfigValue(db, 'current_project_id', projectId)
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
  const row = db
    .prepare('SELECT value FROM app_config WHERE key = ?')
    .get(key) as { value: string } | undefined
  return row?.value ?? null
}

function setConfigValue(db: Database.Database, key: string, value: string) {
  db.prepare(
    'INSERT OR REPLACE INTO app_config (key, value) VALUES (?, ?)',
  ).run(key, value)
}

function getAIConfig(db: Database.Database): AIProviderConfig {
  return {
    provider:
      (getConfigValue(db, 'ai_provider') as 'claude' | 'ollama' | 'none') ??
      (process.env.ANTHROPIC_API_KEY ? 'claude' : 'none'),
    apiKey: getConfigValue(db, 'ai_api_key') ?? process.env.ANTHROPIC_API_KEY ?? undefined,
    ollamaBaseUrl:
      getConfigValue(db, 'ai_ollama_url') ??
      process.env.OLLAMA_BASE_URL ??
      'http://localhost:11434',
    ollamaModel:
      getConfigValue(db, 'ai_ollama_model') ??
      process.env.OLLAMA_MODEL ??
      'llama3.2',
  }
}
