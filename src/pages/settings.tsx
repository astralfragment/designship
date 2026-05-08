import { useEffect, useState } from 'react'
import { Plus, Trash2, RefreshCw } from 'lucide-react'
import { useAppStore } from '../stores/app'
import {
  useProjects,
  useCreateProject,
  useRenameProject,
  useRemoveProject,
} from '../hooks/useProjects'
import { useConfig, useSetAI, useSeedSamples } from '../hooks/useConfig'
import type { AIProviderConfig } from '../../shared/ipc-types'

export function SettingsPage() {
  const projects = useProjects()
  const config = useConfig()
  const create = useCreateProject()
  const rename = useRenameProject()
  const remove = useRemoveProject()
  const seed = useSeedSamples()
  const setAI = useSetAI()

  const currentProjectId = useAppStore((s) => s.currentProjectId)
  const setCurrentProjectId = useAppStore((s) => s.setCurrentProjectId)

  const [newName, setNewName] = useState('')
  const [provider, setProvider] = useState<AIProviderConfig['provider']>('none')
  const [apiKey, setApiKey] = useState('')
  const [ollamaUrl, setOllamaUrl] = useState('http://localhost:11434')
  const [ollamaModel, setOllamaModel] = useState('llama3.2')

  useEffect(() => {
    if (config.data) {
      setProvider(config.data.aiProvider.provider)
      setApiKey(config.data.aiProvider.apiKey ?? '')
      setOllamaUrl(
        config.data.aiProvider.ollamaBaseUrl ?? 'http://localhost:11434',
      )
      setOllamaModel(config.data.aiProvider.ollamaModel ?? 'llama3.2')
    }
  }, [config.data])

  const saveAI = () => {
    setAI.mutate({
      provider,
      apiKey: apiKey || undefined,
      ollamaBaseUrl: ollamaUrl,
      ollamaModel,
    })
  }

  return (
    <div className="mx-auto max-w-3xl space-y-10">
      <div>
        <h1 className="serif text-4xl text-text-primary">Settings</h1>
        <p className="mt-2 text-[15px] text-text-secondary">
          Manage workspaces and AI assist. Fragment works without any of this —
          everything below is optional.
        </p>
      </div>

      <section className="card p-5">
        <h2 className="serif text-2xl text-text-primary">Workspaces</h2>
        <p className="mt-1 text-[13px] text-text-secondary">
          Each workspace has its own fragments, decisions, and specs.
        </p>

        <div className="mt-4 space-y-2">
          {(projects.data ?? []).map((p) => (
            <div
              key={p.id}
              className={`flex items-center gap-2 rounded-lg border px-3 py-2 ${
                p.id === currentProjectId
                  ? 'border-iris/50 bg-lilac/25'
                  : 'border-border-subtle bg-bg-elevated'
              }`}
            >
              <input
                className="input flex-1 border-transparent bg-transparent focus:bg-bg-elevated"
                defaultValue={p.name}
                onBlur={(e) => {
                  if (e.target.value && e.target.value !== p.name) {
                    rename.mutate({ id: p.id, name: e.target.value })
                  }
                }}
              />
              {p.id !== currentProjectId && (
                <button
                  className="btn-ghost text-[12px]"
                  onClick={() => setCurrentProjectId(p.id)}
                >
                  Use
                </button>
              )}
              {p.id === currentProjectId && (
                <span className="pill pill-active">Active</span>
              )}
              <button
                className="btn-ghost text-rose"
                onClick={() => {
                  if (
                    confirm(
                      `Delete workspace "${p.name}" and all its fragments and specs?`,
                    )
                  ) {
                    remove.mutate(p.id, {
                      onSuccess: () => {
                        if (p.id === currentProjectId) setCurrentProjectId(null)
                      },
                    })
                  }
                }}
                aria-label="Delete"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <input
            className="input flex-1"
            placeholder="New workspace name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && newName.trim()) {
                create.mutate(newName.trim(), {
                  onSuccess: (proj) => {
                    setCurrentProjectId(proj.id)
                    setNewName('')
                  },
                })
              }
            }}
          />
          <button
            className="btn-primary"
            disabled={!newName.trim()}
            onClick={() =>
              create.mutate(newName.trim(), {
                onSuccess: (proj) => {
                  setCurrentProjectId(proj.id)
                  setNewName('')
                },
              })
            }
          >
            <Plus size={14} />
            Create
          </button>
          <button
            className="btn-secondary"
            onClick={() =>
              seed.mutate(undefined, {
                onSuccess: (res) => setCurrentProjectId(res.project_id),
              })
            }
          >
            <RefreshCw size={14} />
            Load sample workspace
          </button>
        </div>
      </section>

      <section className="card p-5">
        <h2 className="serif text-2xl text-text-primary">AI assist</h2>
        <p className="mt-1 text-[13px] text-text-secondary">
          Optional. Use Claude or a local Ollama model to upgrade template specs
          into more polished drafts.
        </p>

        <div className="mt-4 flex flex-wrap gap-1.5">
          {(['none', 'claude', 'ollama'] as const).map((p) => (
            <button
              key={p}
              type="button"
              className={`pill ${provider === p ? 'pill-active' : ''}`}
              onClick={() => setProvider(p)}
            >
              {p === 'none' ? 'No AI (template only)' : p}
            </button>
          ))}
        </div>

        {provider === 'claude' && (
          <label className="mt-4 block">
            <span className="text-[12px] font-medium uppercase tracking-wide text-text-muted">
              Anthropic API key
            </span>
            <input
              className="input mt-1.5 w-full"
              type="password"
              placeholder="sk-ant-…"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
            />
          </label>
        )}

        {provider === 'ollama' && (
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="text-[12px] font-medium uppercase tracking-wide text-text-muted">
                Ollama URL
              </span>
              <input
                className="input mt-1.5 w-full"
                value={ollamaUrl}
                onChange={(e) => setOllamaUrl(e.target.value)}
              />
            </label>
            <label className="block">
              <span className="text-[12px] font-medium uppercase tracking-wide text-text-muted">
                Model
              </span>
              <input
                className="input mt-1.5 w-full"
                value={ollamaModel}
                onChange={(e) => setOllamaModel(e.target.value)}
              />
            </label>
          </div>
        )}

        <div className="mt-4 flex justify-end">
          <button className="btn-primary" onClick={saveAI} disabled={setAI.isPending}>
            Save AI settings
          </button>
        </div>
      </section>

      <section className="card p-5 opacity-80">
        <h2 className="serif text-2xl text-text-primary">Future integrations</h2>
        <p className="mt-1 text-[13px] text-text-secondary">
          GitHub, Linear, Jira, Notion, Slack, Figma. The Figma + Git watcher
          code from DesignShip is parked under <code className="font-mono">electron/watchers/</code>{' '}
          and will be revived in a future phase. None of these are wired up yet.
        </p>
      </section>
    </div>
  )
}
