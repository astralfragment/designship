import { contextBridge, ipcRenderer } from 'electron'
import type { IPCChannels } from '../shared/ipc-types'

type ChannelName = keyof IPCChannels

// Type-safe IPC invoke
function invoke<K extends ChannelName>(
  channel: K,
  ...args: IPCChannels[K]['args']
): Promise<IPCChannels[K]['return']> {
  return ipcRenderer.invoke(channel, ...args)
}

const api = {
  // Events
  events: {
    list: (filters = {}) => invoke('events:list', filters),
    get: (id: string) => invoke('events:get', id),
    count: (filters = {}) => invoke('events:count', filters),
  },

  // Projects
  projects: {
    list: () => invoke('projects:list'),
    addFigma: (fileUrl: string) => invoke('projects:add-figma', fileUrl),
    addGit: (repoPath: string) => invoke('projects:add-git', repoPath),
    remove: (id: string) => invoke('projects:remove', id),
    toggleWatch: (id: string, enabled: boolean) => ipcRenderer.invoke('projects:toggle-watch', id, enabled),
  },

  // Figma
  figma: {
    setToken: (token: string) => invoke('figma:set-token', token),
    pollNow: (fileKey: string) => invoke('figma:poll-now', fileKey),
    getSnapshot: (eventId: string) => invoke('figma:get-snapshot', eventId),
  },

  // Git
  git: {
    browseRepo: () => invoke('git:browse-repo'),
    getInfo: (path: string) => invoke('git:get-info', path),
  },

  // Summaries
  summary: {
    generate: (opts: Parameters<typeof invoke<'summary:generate'>>[1]) =>
      invoke('summary:generate', opts),
    list: () => invoke('summary:list'),
    get: (id: string) => invoke('summary:get', id),
  },

  // Config
  config: {
    get: () => invoke('config:get'),
    set: (config: Parameters<typeof invoke<'config:set'>>[1]) =>
      invoke('config:set', config),
    setAI: (config: Parameters<typeof invoke<'config:set-ai'>>[1]) =>
      invoke('config:set-ai', config),
  },

  // Window controls
  window: {
    minimize: () => ipcRenderer.send('window:minimize'),
    maximize: () => ipcRenderer.send('window:maximize'),
    close: () => ipcRenderer.send('window:close'),
  },

  // Event subscriptions
  on: (channel: string, callback: (...args: unknown[]) => void) => {
    const sub = (_event: Electron.IpcRendererEvent, ...args: unknown[]) => callback(...args)
    ipcRenderer.on(channel, sub)
    return () => ipcRenderer.removeListener(channel, sub)
  },
}

contextBridge.exposeInMainWorld('ds', api)

export type DesignShipAPI = typeof api
