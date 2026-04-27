import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { bookApi } from '@/api/book'

const booksKeys = {
  all: ['books'] as const,
  lists: () => [...booksKeys.all, 'list'] as const,
  detail: (id: string) => [...booksKeys.all, 'detail', id] as const,
}

export function useBooks() {
  return useQuery({
    queryKey: booksKeys.lists(),
    queryFn: () => bookApi.getList(),
  })
}

export function useBook(id: string) {
  return useQuery({
    queryKey: booksKeys.detail(id),
    queryFn: () => bookApi.getById(id),
    enabled: !!id,
  })
}

export function useDeleteBook() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => bookApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: booksKeys.lists() })
    },
  })
}
