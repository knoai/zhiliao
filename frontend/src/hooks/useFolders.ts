import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { folderApi } from '@/api/folder'
import type { Folder } from '@/types'

const foldersKeys = {
  all: ['folders'] as const,
  lists: () => [...foldersKeys.all, 'list'] as const,
}

export function useFolders() {
  return useQuery({
    queryKey: foldersKeys.lists(),
    queryFn: () => folderApi.getList(),
  })
}

export function useCreateFolder() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ name, parentId }: { name: string; parentId?: string }) =>
      folderApi.create({ name, parent_id: parentId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: foldersKeys.lists() })
    },
  })
}

export function useDeleteFolder() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => folderApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: foldersKeys.lists() })
    },
  })
}
