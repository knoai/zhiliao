import request from './request'
import type { Doc, DocListItem, DocVersion, CreateDocData, UpdateDocData, SortUpdateData } from '@/types'

export const docApi = {
  getList(folderId?: string, status?: string, keyword?: string): Promise<DocListItem[]> {
    return request.get('/docs', {
      params: { folder_id: folderId, status, keyword },
    })
  },

  create(data: CreateDocData): Promise<Doc> {
    return request.post('/docs', data)
  },

  getById(id: string): Promise<Doc> {
    return request.get(`/docs/${id}`)
  },

  update(id: string, data: UpdateDocData): Promise<Doc> {
    return request.put(`/docs/${id}`, data)
  },

  updateStatus(id: string, status: 'draft' | 'published'): Promise<Doc> {
    return request.patch(`/docs/${id}/status`, { status })
  },

  updateSort(id: string, data: SortUpdateData): Promise<Doc> {
    return request.patch(`/docs/${id}/sort`, data)
  },

  delete(id: string, hard = false): Promise<void> {
    return request.delete(`/docs/${id}`, {
      params: { hard },
    })
  },

  restore(id: string): Promise<Doc> {
    return request.post(`/docs/${id}/restore`)
  },

  getVersions(id: string): Promise<DocVersion[]> {
    return request.get(`/docs/${id}/versions`)
  },
}
