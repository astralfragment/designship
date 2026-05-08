// Shared IPC type contract between main and renderer processes

// ===== Fragment MVP types =====

export type FragmentType =
  | 'note'
  | 'feedback'
  | 'decision'
  | 'requirement'
  | 'question'
  | 'qa'

export type SpecStatus = 'draft' | 'review' | 'ready' | 'shipped'

export interface Project {
  id: string
  name: string
  type: string
  identifier: string
  config: Record<string, unknown> | null
  created_at: string
}

export interface Fragment {
  id: string
  project_id: string
  title: string
  content: string
  type: FragmentType
  source: string | null
  tags: string[]
  created_at: string
  updated_at: string
}

export interface FragmentInput {
  project_id: string
  title: string
  content?: string
  type?: FragmentType
  source?: string | null
  tags?: string[]
}

export interface FragmentFilters {
  project_id?: string
  type?: FragmentType
  tag?: string
  search?: string
  limit?: number
}

export interface ContextGroup {
  id: string
  project_id: string
  name: string
  description: string | null
  created_at: string
}

export interface Decision {
  id: string
  project_id: string
  title: string
  rationale: string | null
  fragment_ids: string[]
  created_at: string
}

export interface Spec {
  id: string
  project_id: string
  title: string
  content_md: string
  status: SpecStatus
  fragment_ids: string[]
  created_at: string
  updated_at: string
}

export interface SpecDraftOptions {
  project_id: string
  fragment_ids: string[]
  title?: string
  use_ai?: boolean
}

export interface SpecUpdateInput {
  title?: string
  content_md?: string
  status?: SpecStatus
}

// ===== AI / app config =====

export interface AIProviderConfig {
  provider: 'claude' | 'ollama' | 'none'
  apiKey?: string
  ollamaBaseUrl?: string
  ollamaModel?: string
}

export interface AppConfig {
  aiProvider: AIProviderConfig
  currentProjectId: string | null
}

// ===== Parked DesignShip types (kept so watcher/event code still compiles) =====

export type EventSource = 'figma' | 'git'
export type EventType =
  | 'version_created'
  | 'component_added'
  | 'component_updated'
  | 'component_removed'
  | 'file_renamed'
  | 'commit'
  | 'branch_created'
  | 'branch_merged'
  | 'tag_created'

export type SummaryType = 'weekly' | 'changelog' | 'standup' | 'adhoc'

export interface DSEvent {
  id: string
  timestamp: string
  source: EventSource
  type: EventType
  title: string
  body: string | null
  actor: string | null
  project_id: string | null
  metadata: Record<string, unknown> | null
  created_at: string
}

export interface EventLink {
  id: string
  source_event_id: string
  target_event_id: string
  link_type: 'figma_ref' | 'implements' | 'related'
  created_at: string
}

export interface Summary {
  id: string
  type: SummaryType
  period_start: string
  period_end: string
  content: string
  model_used: string | null
  event_ids: string[] | null
  created_at: string
}

export interface Snapshot {
  id: string
  event_id: string
  figma_node_id: string | null
  file_path: string
  created_at: string
}

export interface EventFilters {
  source?: EventSource
  project_id?: string
  actor?: string
  from?: string
  to?: string
  limit?: number
  offset?: number
}

export interface SummaryOptions {
  type: SummaryType
  period_start: string
  period_end: string
  project_ids?: string[]
  use_ai?: boolean
}

export interface GitRepoInfo {
  path: string
  name: string
  currentBranch: string
  remoteUrl: string | null
}

// ===== IPC channel definitions =====

export interface IPCChannels {
  // Projects
  'projects:list': { args: []; return: Project[] }
  'projects:create': { args: [string]; return: Project }
  'projects:rename': { args: [string, string]; return: Project }
  'projects:remove': { args: [string]; return: void }

  // Fragments
  'fragments:list': { args: [FragmentFilters]; return: Fragment[] }
  'fragments:get': { args: [string]; return: Fragment | null }
  'fragments:add': { args: [FragmentInput]; return: Fragment }
  'fragments:update': { args: [string, Partial<FragmentInput>]; return: Fragment }
  'fragments:delete': { args: [string]; return: void }

  // Specs
  'specs:list': { args: [string]; return: Spec[] }
  'specs:get': { args: [string]; return: Spec | null }
  'specs:draft': { args: [SpecDraftOptions]; return: Spec }
  'specs:update': { args: [string, SpecUpdateInput]; return: Spec }
  'specs:delete': { args: [string]; return: void }
  'specs:export': { args: [string, 'markdown' | 'github']; return: string }
  'specs:save-as': { args: [string]; return: string | null }

  // Sample data
  'seed:samples': { args: []; return: { project_id: string } }
  'seed:reset-welcome-flag': { args: []; return: void }

  // Config
  'config:get': { args: []; return: AppConfig }
  'config:set-ai': { args: [AIProviderConfig]; return: void }
  'config:set-current-project': { args: [string]; return: void }
}
