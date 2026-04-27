import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { docApi } from '@/api/doc'
import type { Doc, DocListItem, UpdateDocData } from '@/types'

const docsKeys = {
  all: ['docs'] as const,
  lists: () => [...docsKeys.all, 'list'] as const,
  list: (filters: { folderId?: string; status?: string; keyword?: string }) =>
    [...docsKeys.lists(), filters] as const,
  details: () => [...docsKeys.all, 'detail'] as const,
  detail: (id: string) => [...docsKeys.details(), id] as const,
}

export function useDocs(filters?: { folderId?: string; status?: string; keyword?: string }) {
  return useQuery({
    queryKey: docsKeys.list(filters || {}),
    queryFn: () => docApi.getList(filters?.folderId, filters?.status, filters?.keyword),
  })
}

export function useDoc(id: string) {
  return useQuery({
    queryKey: docsKeys.detail(id),
    queryFn: () => docApi.getById(id),
    enabled: !!id,
  })
}

export function useCreateDoc() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data?: { title?: string; folder_id?: string; content?: any[] }) =>
      docApi.create(data || {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: docsKeys.lists() })
    },
  })
}

export function useUpdateDoc() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateDocData }) => docApi.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: docsKeys.detail(variables.id) })
      queryClient.invalidateQueries({ queryKey: docsKeys.lists() })
    },
  })
}

export function useDeleteDoc() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => docApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: docsKeys.lists() })
    },
  })
}
