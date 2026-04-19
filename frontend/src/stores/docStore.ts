import { create } from 'zustand'
import { docApi } from '@/api/doc'
import type { Doc, DocListItem, SlateNode, UpdateDocData } from '@/types'

interface DocState {
  docs: DocListItem[]
  currentDoc: Doc | null
  isLoading: boolean
  isSaving: boolean
  readMode: boolean

  // Getters
  docList: () => DocListItem[]
  currentTitle: () => string

  // Actions
  fetchDocs: (folderId?: string, status?: string, keyword?: string) => Promise<void>
  fetchDoc: (id: string) => Promise<Doc | null>
  createDoc: (folderId?: string) => Promise<Doc>
  updateDoc: (id: string, data: UpdateDocData) => Promise<void>
  updateDocStatus: (id: string, status: 'draft' | 'published') => Promise<void>
  updateDocSort: (id: string, sortOrder: number, folderId?: string) => Promise<void>
  deleteDoc: (id: string) => Promise<void>
  setCurrentDoc: (doc: Doc | null) => void
  setReadMode: (mode: boolean) => void
  toggleReadMode: () => void
}

const DEFAULT_CONTENT: SlateNode[] = [
  {
    type: 'paragraph',
    children: [{ text: '' }],
  },
]

export const useDocStore = create<DocState>((set, get) => ({
  docs: [],
  currentDoc: null,
  isLoading: false,
  isSaving: false,
  readMode: false,

  docList: () => get().docs,
  currentTitle: () => get().currentDoc?.title || '无标题文档',

  fetchDocs: async (folderId?: string, status?: string, keyword?: string) => {
    set({ isLoading: true })
    try {
      const res = await docApi.getList(folderId, status, keyword)
      set({ docs: res })
    } finally {
      set({ isLoading: false })
    }
  },

  fetchDoc: async (id: string) => {
    set({ isLoading: true })
    try {
      const res = await docApi.getById(id)
      set({ currentDoc: res })
      return res
    } finally {
      set({ isLoading: false })
    }
  },

  createDoc: async (folderId?: string) => {
    const res = await docApi.create({
      title: '无标题文档',
      folder_id: folderId,
      content: DEFAULT_CONTENT,
    })
    return res
  },

  updateDoc: async (id: string, data: UpdateDocData) => {
    set({ isSaving: true })
    try {
      const res = await docApi.update(id, data)
      set((state) => ({
        currentDoc: state.currentDoc?.id === id ? { ...state.currentDoc, ...res } : state.currentDoc,
      }))
    } finally {
      set({ isSaving: false })
    }
  },

  updateDocStatus: async (id: string, status: 'draft' | 'published') => {
    const res = await docApi.updateStatus(id, status)
    set((state) => ({
      currentDoc: state.currentDoc?.id === id ? { ...state.currentDoc, ...res } : state.currentDoc,
    }))
  },

  updateDocSort: async (id: string, sortOrder: number, folderId?: string) => {
    const res = await docApi.updateSort(id, { sort_order: sortOrder, folder_id: folderId })
    set((state) => ({
      currentDoc: state.currentDoc?.id === id ? { ...state.currentDoc, ...res } : state.currentDoc,
      docs: state.docs.map((d) => (d.id === id ? { ...d, sort_order: sortOrder } : d)),
    }))
  },

  deleteDoc: async (id: string) => {
    await docApi.delete(id)
    set((state) => ({
      docs: state.docs.filter((d) => d.id !== id),
      currentDoc: state.currentDoc?.id === id ? null : state.currentDoc,
    }))
  },

  setCurrentDoc: (doc: Doc | null) => {
    set({ currentDoc: doc })
  },

  setReadMode: (mode: boolean) => {
    set({ readMode: mode })
  },

  toggleReadMode: () => {
    set((state) => ({ readMode: !state.readMode }))
  },
}))
