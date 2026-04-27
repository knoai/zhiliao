import { create } from 'zustand'

interface DocUIState {
  readMode: boolean
  setReadMode: (mode: boolean) => void
  toggleReadMode: () => void
}

export const useDocStore = create<DocUIState>((set) => ({
  readMode: false,
  setReadMode: (mode: boolean) => {
    set({ readMode: mode })
  },
  toggleReadMode: () => {
    set((state) => ({ readMode: !state.readMode }))
  },
}))
