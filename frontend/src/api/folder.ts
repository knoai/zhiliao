import request from './request'
import type { Folder, FolderTreeItem } from '@/types'

export interface CreateFolderData {
  name: string
  parent_id?: string
}

export interface UpdateFolderData {
  name?: string
  parent_id?: string
  sort_order?: number
}

export interface SortFolderData {
  sort_order: number
  parent_id?: string
}

export const folderApi = {
  getList(): Promise<Folder[]> {
    return request.get('/folders')
  },

  create(data: CreateFolderData): Promise<Folder> {
    return request.post('/folders', data)
  },

  getById(id: string): Promise<Folder> {
    return request.get(`/folders/${id}`)
  },

  update(id: string, data: UpdateFolderData): Promise<Folder> {
    return request.put(`/folders/${id}`, data)
  },

  updateSort(id: string, data: SortFolderData): Promise<Folder> {
    return request.patch(`/folders/${id}/sort`, data)
  },

  delete(id: string): Promise<void> {
    return request.delete(`/folders/${id}`)
  },
}
