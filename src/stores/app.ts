import { create } from 'zustand'

interface AppState {
  currentProjectId: string | null
  setCurrentProjectId: (id: string | null) => void

  selectedFragmentIds: string[]
  toggleFragmentSelected: (id: string) => void
  clearSelection: () => void
  setSelection: (ids: string[]) => void

  welcomeDismissed: boolean
  dismissWelcome: () => void

  activeSpecId: string | null
  setActiveSpecId: (id: string | null) => void
}

export const useAppStore = create<AppState>((set) => ({
  currentProjectId: null,
  setCurrentProjectId: (id) => set({ currentProjectId: id }),

  selectedFragmentIds: [],
  toggleFragmentSelected: (id) =>
    set((s) => ({
      selectedFragmentIds: s.selectedFragmentIds.includes(id)
        ? s.selectedFragmentIds.filter((x) => x !== id)
        : [...s.selectedFragmentIds, id],
    })),
  clearSelection: () => set({ selectedFragmentIds: [] }),
  setSelection: (ids) => set({ selectedFragmentIds: ids }),

  welcomeDismissed: false,
  dismissWelcome: () => set({ welcomeDismissed: true }),

  activeSpecId: null,
  setActiveSpecId: (id) => set({ activeSpecId: id }),
}))
