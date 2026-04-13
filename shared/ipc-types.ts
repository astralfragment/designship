// Shared IPC type contract between main and renderer processes

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

export interface Project {
  id: string
  name: string
  type: 'figma_file' | 'git_repo'
  identifier: string
  config: Record<string, unknown> | null
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

export interface AIProviderConfig {
  provider: 'claude' | 'ollama' | 'none'
  apiKey?: string
  ollamaBaseUrl?: string
  ollamaModel?: string
}

export interface AppConfig {
  figmaToken: string | null
  figmaPollInterval: number
  aiProvider: AIProviderConfig
  theme: 'dark' | 'light'
}

export interface GitRepoInfo {
  path: string
  name: string
  currentBranch: string
  remoteUrl: string | null
}

// IPC channel definitions
export interface IPCChannels {
  // Events
  'events:list': { args: [EventFilters]; return: DSEvent[] }
  'events:get': { args: [string]; return: DSEvent | null }
  'events:count': { args: [EventFilters]; return: number }

  // Projects
  'projects:list': { args: []; return: Project[] }
  'projects:add-figma': { args: [string]; return: Project }
  'projects:add-git': { args: [string]; return: Project }
  'projects:remove': { args: [string]; return: void }

  // Figma
  'figma:set-token': { args: [string]; return: boolean }
  'figma:poll-now': { args: [string]; return: DSEvent[] }
  'figma:get-snapshot': { args: [string]; return: string | null }

  // Git
  'git:browse-repo': { args: []; return: string | null }
  'git:get-info': { args: [string]; return: GitRepoInfo | null }

  // AI / Summaries
  'summary:generate': { args: [SummaryOptions]; return: string }
  'summary:list': { args: []; return: Summary[] }
  'summary:get': { args: [string]; return: Summary | null }

  // Config
  'config:get': { args: []; return: AppConfig }
  'config:set': { args: [Partial<AppConfig>]; return: void }
  'config:set-ai': { args: [AIProviderConfig]; return: void }
}
