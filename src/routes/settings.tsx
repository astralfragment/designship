import { createRoute } from '@tanstack/react-router'
import { Route as rootRoute } from './__root'
import { useState } from 'react'
import { useProjects, useAddFigmaProject, useAddGitProject, useRemoveProject } from '../hooks/useProjects'
import { Figma, GitBranch, Plus, Trash2, Check, Loader2 } from 'lucide-react'

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: '/settings',
  component: SettingsPage,
})

function SettingsPage() {
  return (
    <div className="mx-auto max-w-2xl animate-fade-in">
      <h1 className="font-display text-2xl font-bold text-text-primary">Settings</h1>
      <p className="mt-1 text-sm text-text-secondary">
        Configure your integrations and preferences.
      </p>

      <div className="mt-8 flex flex-col gap-8">
        <FigmaSection />
        <GitSection />
        <AISection />
      </div>
    </div>
  )
}

function FigmaSection() {
  const [token, setToken] = useState('')
  const [fileUrl, setFileUrl] = useState('')
  const [saved, setSaved] = useState(false)
  const { data: projects = [] } = useProjects()
  const addFigma = useAddFigmaProject()
  const removeProject = useRemoveProject()

  const figmaProjects = projects.filter((p: { type: string }) => p.type === 'figma_file')

  const handleSaveToken = async () => {
    if (!token.trim()) return
    await window.ds.figma.setToken(token.trim())
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleAddFile = async () => {
    if (!fileUrl.trim()) return
    await addFigma.mutateAsync(fileUrl.trim())
    setFileUrl('')
  }

  return (
    <section>
      <div className="flex items-center gap-2 mb-4">
        <Figma className="size-5 text-accent-figma" />
        <h2 className="font-display text-lg font-semibold text-text-primary">Figma</h2>
      </div>

      {/* Token input */}
      <div className="rounded-xl border border-border-subtle bg-bg-card p-4">
        <label className="block text-xs font-medium text-text-secondary mb-1.5">
          Personal Access Token
        </label>
        <div className="flex gap-2">
          <input
            type="password"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="figd_..."
            className="flex-1 rounded-lg border border-border-subtle bg-bg-secondary px-3 py-1.5 text-sm text-text-primary placeholder:text-text-muted focus:border-accent-figma focus:outline-none"
          />
          <button
            onClick={handleSaveToken}
            className="flex items-center gap-1.5 rounded-lg bg-accent-figma/15 px-3 py-1.5 text-xs font-medium text-accent-figma hover:bg-accent-figma/25"
          >
            {saved ? <Check className="size-3" /> : null}
            {saved ? 'Saved' : 'Save'}
          </button>
        </div>

        {/* Add file */}
        <label className="mt-4 block text-xs font-medium text-text-secondary mb-1.5">
          Watch a Figma file
        </label>
        <div className="flex gap-2">
          <input
            value={fileUrl}
            onChange={(e) => setFileUrl(e.target.value)}
            placeholder="https://figma.com/design/..."
            className="flex-1 rounded-lg border border-border-subtle bg-bg-secondary px-3 py-1.5 text-sm text-text-primary placeholder:text-text-muted focus:border-accent-figma focus:outline-none"
          />
          <button
            onClick={handleAddFile}
            disabled={addFigma.isPending}
            className="flex items-center gap-1.5 rounded-lg bg-bg-tertiary px-3 py-1.5 text-xs font-medium text-text-secondary hover:text-text-primary disabled:opacity-50"
          >
            {addFigma.isPending ? <Loader2 className="size-3 animate-spin" /> : <Plus className="size-3" />}
            Add
          </button>
        </div>

        {/* Project list */}
        {figmaProjects.length > 0 && (
          <div className="mt-4 flex flex-col gap-1">
            {figmaProjects.map((p: { id: string; name: string; identifier: string }) => (
              <div key={p.id} className="flex items-center justify-between rounded-lg bg-bg-secondary px-3 py-2">
                <span className="text-xs text-text-secondary">{p.name}</span>
                <button
                  onClick={() => removeProject.mutate(p.id)}
                  className="text-text-muted hover:text-red-400"
                >
                  <Trash2 className="size-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

function GitSection() {
  const { data: projects = [] } = useProjects()
  const addGit = useAddGitProject()
  const removeProject = useRemoveProject()

  const gitProjects = projects.filter((p: { type: string }) => p.type === 'git_repo')

  return (
    <section>
      <div className="flex items-center gap-2 mb-4">
        <GitBranch className="size-5 text-accent-git" />
        <h2 className="font-display text-lg font-semibold text-text-primary">Git Repositories</h2>
      </div>

      <div className="rounded-xl border border-border-subtle bg-bg-card p-4">
        <button
          onClick={() => addGit.mutate()}
          disabled={addGit.isPending}
          className="flex items-center gap-2 rounded-lg bg-accent-git/15 px-4 py-2 text-sm font-medium text-accent-git hover:bg-accent-git/25 disabled:opacity-50"
        >
          {addGit.isPending ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
          Add repository
        </button>

        {gitProjects.length > 0 && (
          <div className="mt-4 flex flex-col gap-1">
            {gitProjects.map((p: { id: string; name: string; identifier: string }) => (
              <div key={p.id} className="flex items-center justify-between rounded-lg bg-bg-secondary px-3 py-2">
                <div>
                  <span className="text-xs font-medium text-text-primary">{p.name}</span>
                  <span className="ml-2 font-mono text-[10px] text-text-muted">{p.identifier}</span>
                </div>
                <button
                  onClick={() => removeProject.mutate(p.id)}
                  className="text-text-muted hover:text-red-400"
                >
                  <Trash2 className="size-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

function AISection() {
  const [provider, setProvider] = useState<'none' | 'ollama' | 'claude'>('none')
  const [apiKey, setApiKey] = useState('')
  const [ollamaUrl, setOllamaUrl] = useState('http://localhost:11434')
  const [saved, setSaved] = useState(false)

  const handleSave = async () => {
    await window.ds.config.setAI({
      provider,
      apiKey: provider === 'claude' ? apiKey : undefined,
      ollamaBaseUrl: provider === 'ollama' ? ollamaUrl : undefined,
      ollamaModel: 'qwen2.5-coder:14b',
    })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <section>
      <div className="flex items-center gap-2 mb-4">
        <span className="text-accent-ai text-lg">AI</span>
        <h2 className="font-display text-lg font-semibold text-text-primary">Summaries</h2>
      </div>

      <div className="rounded-xl border border-border-subtle bg-bg-card p-4">
        <p className="text-xs text-text-secondary mb-3">
          Template-based summaries work without AI. Enable AI for higher quality output.
        </p>

        <div className="flex gap-2 mb-4">
          {(['none', 'ollama', 'claude'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setProvider(p)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                provider === p
                  ? 'bg-accent-ai/15 text-accent-ai'
                  : 'bg-bg-secondary text-text-muted hover:text-text-secondary'
              }`}
            >
              {p === 'none' ? 'Templates only' : p === 'ollama' ? 'Ollama (local)' : 'Claude API'}
            </button>
          ))}
        </div>

        {provider === 'claude' && (
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="sk-ant-..."
            className="mb-3 w-full rounded-lg border border-border-subtle bg-bg-secondary px-3 py-1.5 text-sm text-text-primary placeholder:text-text-muted focus:border-accent-ai focus:outline-none"
          />
        )}

        {provider === 'ollama' && (
          <input
            value={ollamaUrl}
            onChange={(e) => setOllamaUrl(e.target.value)}
            placeholder="http://localhost:11434"
            className="mb-3 w-full rounded-lg border border-border-subtle bg-bg-secondary px-3 py-1.5 text-sm text-text-primary placeholder:text-text-muted focus:border-accent-ai focus:outline-none"
          />
        )}

        <button
          onClick={handleSave}
          className="flex items-center gap-1.5 rounded-lg bg-bg-tertiary px-4 py-2 text-xs font-medium text-text-secondary hover:text-text-primary"
        >
          {saved ? <Check className="size-3" /> : null}
          {saved ? 'Saved' : 'Save AI settings'}
        </button>
      </div>
    </section>
  )
}
