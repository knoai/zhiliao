import { create } from 'zustand'
import { folderApi } from '@/api/folder'
import type { Folder, FolderTreeItem } from '@/types'

interface FolderState {
  folders: Folder[]
  currentFolder: Folder | null
  isLoading: boolean

  // Getters
  folderTree: () => FolderTreeItem[]

  // Actions
  fetchFolders: () => Promise<void>
  createFolder: (name: string, parentId?: string) => Promise<Folder>
  updateFolder: (id: string, name: string) => Promise<void>
  updateFolderSort: (id: string, sortOrder: number, parentId?: string) => Promise<void>
  deleteFolder: (id: string) => Promise<void>
  setCurrentFolder: (folder: Folder | null) => void
}

const buildTree = (flatList: Folder[]): FolderTreeItem[] => {
  const map = new Map<string, FolderTreeItem>()
  const roots: FolderTreeItem[] = []

  flatList.forEach((folder) => {
    map.set(folder.id, { ...folder, children: [] })
  })

  flatList.forEach((folder) => {
    const node = map.get(folder.id)!
    if (folder.parent_id && map.has(folder.parent_id)) {
      const parent = map.get(folder.parent_id)!
      parent.children.push(node)
    } else {
      roots.push(node)
    }
  })

  return roots
}

export const useFolderStore = create<FolderState>((set, get) => ({
  folders: [],
  currentFolder: null,
  isLoading: false,

  folderTree: () => buildTree(get().folders),

  fetchFolders: async () => {
    set({ isLoading: true })
    try {
      const res = await folderApi.getList()
      set({ folders: res })
    } finally {
      set({ isLoading: false })
    }
  },

  createFolder: async (name: string, parentId?: string) => {
    const res = await folderApi.create({ name, parent_id: parentId })
    set((state) => ({ folders: [...state.folders, res] }))
    return res
  },

  updateFolder: async (id: string, name: string) => {
    const res = await folderApi.update(id, { name })
    set((state) => ({
      folders: state.folders.map((f) => (f.id === id ? { ...f, ...res } : f)),
    }))
  },

  updateFolderSort: async (id: string, sortOrder: number, parentId?: string) => {
    const res = await folderApi.updateSort(id, { sort_order: sortOrder, parent_id: parentId })
    set((state) => ({
      folders: state.folders.map((f) => (f.id === id ? { ...f, ...res } : f)),
    }))
  },

  deleteFolder: async (id: string) => {
    await folderApi.delete(id)
    set((state) => ({
      folders: state.folders.filter((f) => f.id !== id),
      currentFolder: state.currentFolder?.id === id ? null : state.currentFolder,
    }))
  },

  setCurrentFolder: (folder: Folder | null) => {
    set({ currentFolder: folder })
  },
}))
