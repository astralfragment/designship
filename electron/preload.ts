import { contextBridge, ipcRenderer } from 'electron'
import type {
  IPCChannels,
  AIProviderConfig,
  FragmentInput,
  FragmentFilters,
  SpecDraftOptions,
  SpecUpdateInput,
} from '../shared/ipc-types'

type ChannelName = keyof IPCChannels

function invoke<K extends ChannelName>(
  channel: K,
  ...args: IPCChannels[K]['args']
): Promise<IPCChannels[K]['return']> {
  return ipcRenderer.invoke(channel, ...args)
}

const api = {
  // Projects
  projects: {
    list: () => invoke('projects:list'),
    create: (name: string) => invoke('projects:create', name),
    rename: (id: string, name: string) => invoke('projects:rename', id, name),
    remove: (id: string) => invoke('projects:remove', id),
  },

  // Fragments
  fragments: {
    list: (filters: FragmentFilters = {}) => invoke('fragments:list', filters),
    get: (id: string) => invoke('fragments:get', id),
    add: (input: FragmentInput) => invoke('fragments:add', input),
    update: (id: string, patch: Partial<FragmentInput>) =>
      invoke('fragments:update', id, patch),
    delete: (id: string) => invoke('fragments:delete', id),
  },

  // Specs
  specs: {
    list: (projectId: string) => invoke('specs:list', projectId),
    get: (id: string) => invoke('specs:get', id),
    draft: (opts: SpecDraftOptions) => invoke('specs:draft', opts),
    update: (id: string, patch: SpecUpdateInput) =>
      invoke('specs:update', id, patch),
    delete: (id: string) => invoke('specs:delete', id),
    export: (id: string, format: 'markdown' | 'github') =>
      invoke('specs:export', id, format),
    saveAs: (id: string) => invoke('specs:save-as', id),
  },

  // Sample data
  seed: {
    samples: () => invoke('seed:samples'),
    resetWelcomeFlag: () => invoke('seed:reset-welcome-flag'),
  },

  // Config
  config: {
    get: () => invoke('config:get'),
    setAI: (config: AIProviderConfig) => invoke('config:set-ai', config),
    setCurrentProject: (projectId: string) =>
      invoke('config:set-current-project', projectId),
  },

  // Window controls
  window: {
    minimize: () => ipcRenderer.send('window:minimize'),
    maximize: () => ipcRenderer.send('window:maximize'),
    close: () => ipcRenderer.send('window:close'),
  },
}

contextBridge.exposeInMainWorld('fragment', api)

export type FragmentAPI = typeof api
