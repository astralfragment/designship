import { useState, useEffect } from 'react'
import { useProjects, useAddFigmaProject, useAddGitProject, useRemoveProject } from '../hooks/useProjects'
import { Figma, GitBranch, Plus, Trash2, Check, Loader2, Sparkles } from 'lucide-react'

export function SettingsPage() {
  return (
    <div className="mx-auto max-w-[640px]">
      <div className="mb-8">
        <h1 className="font-display text-[22px] font-bold tracking-tight text-text-primary">Settings</h1>
        <p className="mt-0.5 text-[13px] text-text-secondary">
          Configure integrations and AI preferences.
        </p>
      </div>
      <div className="flex flex-col gap-6">
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
  const remove = useRemoveProject()
  const figmaProjects = (projects as Array<{ id: string; name: string; type: string; identifier: string }>)
    .filter((p) => p.type === 'figma_file')

  const saveToken = async () => {
    if (!token.trim()) return
    await window.ds.figma.setToken(token.trim())
    setSaved(true)
    setToken('')
    setTimeout(() => setSaved(false), 2000)
  }

  const addFile = async () => {
    if (!fileUrl.trim()) return
    await addFigma.mutateAsync(fileUrl.trim())
    setFileUrl('')
  }

  return (
    <Section icon={<Figma className="size-4 text-accent-figma" />} title="Figma">
      <Field label="Personal Access Token">
        <div className="flex gap-2">
          <input
            type="password"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="figd_..."
            className="input flex-1"
          />
          <button onClick={saveToken} className="btn-accent" style={{ '--accent': '#a259ff' } as React.CSSProperties}>
            {saved ? <Check className="size-3" /> : null}
            {saved ? 'Saved' : 'Save'}
          </button>
        </div>
      </Field>

      <Field label="Watch a Figma file">
        <div className="flex gap-2">
          <input
            value={fileUrl}
            onChange={(e) => setFileUrl(e.target.value)}
            placeholder="https://figma.com/design/..."
            className="input flex-1"
            onKeyDown={(e) => e.key === 'Enter' && addFile()}
          />
          <button onClick={addFile} disabled={addFigma.isPending} className="btn-secondary">
            {addFigma.isPending ? <Loader2 className="size-3 animate-spin" /> : <Plus className="size-3" />}
            Add
          </button>
        </div>
      </Field>

      {figmaProjects.length > 0 && (
        <div className="flex flex-col gap-1 mt-1">
          {figmaProjects.map((p) => (
            <ProjectRow key={p.id} name={p.name} detail={p.identifier} onRemove={() => remove.mutate(p.id)} />
          ))}
        </div>
      )}
    </Section>
  )
}

function GitSection() {
  const { data: projects = [] } = useProjects()
  const addGit = useAddGitProject()
  const remove = useRemoveProject()
  const gitProjects = (projects as Array<{ id: string; name: string; type: string; identifier: string }>)
    .filter((p) => p.type === 'git_repo')

  return (
    <Section icon={<GitBranch className="size-4 text-accent-git" />} title="Git Repositories">
      <button
        onClick={() => addGit.mutate()}
        disabled={addGit.isPending}
        className="flex items-center gap-2 rounded-lg bg-accent-git/10 px-4 py-2 text-[13px] font-medium text-accent-git hover:bg-accent-git/20 disabled:opacity-50"
      >
        {addGit.isPending ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
        Browse for repository
      </button>

      {gitProjects.length > 0 && (
        <div className="flex flex-col gap-1 mt-3">
          {gitProjects.map((p) => (
            <ProjectRow key={p.id} name={p.name} detail={p.identifier} onRemove={() => remove.mutate(p.id)} />
          ))}
        </div>
      )}
    </Section>
  )
}

function AISection() {
  const [provider, setProvider] = useState<'none' | 'ollama' | 'claude'>('none')
  const [apiKey, setApiKey] = useState('')
  const [ollamaUrl, setOllamaUrl] = useState('http://localhost:11434')
  const [saved, setSaved] = useState(false)

  // Load current config on mount
  useEffect(() => {
    window.ds.config.get().then((cfg) => {
      setProvider(cfg.aiProvider.provider)
      setOllamaUrl(cfg.aiProvider.ollamaBaseUrl ?? 'http://localhost:11434')
    })
  }, [])

  const save = async () => {
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
    <Section icon={<Sparkles className="size-4 text-accent-ai" />} title="AI Summaries">
      <p className="text-[12px] text-text-muted mb-3">
        Template summaries work without AI. Enable AI for richer, natural-language output.
      </p>

      <div className="flex gap-2 mb-3">
        {(['none', 'ollama', 'claude'] as const).map((p) => (
          <button
            key={p}
            onClick={() => setProvider(p)}
            className={`rounded-lg px-3 py-1.5 text-[12px] font-medium transition-colors ${
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
        <Field label="Anthropic API Key">
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="sk-ant-..."
            className="input w-full"
          />
        </Field>
      )}

      {provider === 'ollama' && (
        <Field label="Ollama URL">
          <input
            value={ollamaUrl}
            onChange={(e) => setOllamaUrl(e.target.value)}
            placeholder="http://localhost:11434"
            className="input w-full"
          />
        </Field>
      )}

      <button onClick={save} className="btn-secondary mt-2">
        {saved ? <Check className="size-3 text-accent-git" /> : null}
        {saved ? 'Saved' : 'Save AI settings'}
      </button>
    </Section>
  )
}

// --- Shared components ---

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-white/[0.06] bg-bg-card/60 p-5">
      <div className="flex items-center gap-2 mb-4">
        {icon}
        <h2 className="font-display text-[15px] font-semibold text-text-primary">{title}</h2>
      </div>
      {children}
    </section>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-3">
      <label className="block text-[11px] font-medium text-text-secondary mb-1.5">{label}</label>
      {children}
    </div>
  )
}

function ProjectRow({ name, detail, onRemove }: { name: string; detail: string; onRemove: () => void }) {
  return (
    <div className="flex items-center justify-between rounded-lg bg-bg-primary/40 px-3 py-2">
      <div className="min-w-0">
        <span className="text-[12px] font-medium text-text-primary">{name}</span>
        <span className="ml-2 truncate font-mono text-[10px] text-text-muted">{detail}</span>
      </div>
      <button onClick={onRemove} className="shrink-0 p-1 text-text-muted hover:text-red-400">
        <Trash2 className="size-3" />
      </button>
    </div>
  )
}
