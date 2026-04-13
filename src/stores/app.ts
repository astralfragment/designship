import { create } from 'zustand'
import type { EventSource } from '../../shared/ipc-types'

type ViewMode = 'builder' | 'stakeholder'

interface AppState {
  viewMode: ViewMode
  setViewMode: (mode: ViewMode) => void

  sourceFilter: EventSource | null
  setSourceFilter: (source: EventSource | null) => void

  dateRange: { from: string | null; to: string | null }
  setDateRange: (from: string | null, to: string | null) => void

  sidebarOpen: boolean
  toggleSidebar: () => void
}

export const useAppStore = create<AppState>((set) => ({
  viewMode: 'builder',
  setViewMode: (mode) => set({ viewMode: mode }),

  sourceFilter: null,
  setSourceFilter: (source) => set({ sourceFilter: source }),

  dateRange: { from: null, to: null },
  setDateRange: (from, to) => set({ dateRange: { from, to } }),

  sidebarOpen: true,
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
}))
