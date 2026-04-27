import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { bookApi } from '@/api/book'
import type { CreateBookData, UpdateBookData, CreateChapterData, UpdateChapterData } from '@/types'

const booksKeys = {
  all: ['books'] as const,
  lists: () => [...booksKeys.all, 'list'] as const,
  detail: (id: string) => [...booksKeys.all, 'detail', id] as const,
  chapters: (bookId: string) => [...booksKeys.all, 'chapters', bookId] as const,
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

export function useCreateBook() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateBookData) => bookApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: booksKeys.lists() })
    },
  })
}

export function useUpdateBook() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateBookData }) => bookApi.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: booksKeys.detail(variables.id) })
      queryClient.invalidateQueries({ queryKey: booksKeys.lists() })
    },
  })
}

export function useBookChapters(bookId: string) {
  return useQuery({
    queryKey: booksKeys.chapters(bookId),
    queryFn: () => bookApi.getChapters(bookId),
    enabled: !!bookId,
  })
}

export function useCreateChapter() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ bookId, data }: { bookId: string; data: CreateChapterData }) =>
      bookApi.createChapter(bookId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: booksKeys.chapters(variables.bookId) })
    },
  })
}

export function useUpdateChapter() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ bookId, chapterId, data }: { bookId: string; chapterId: string; data: UpdateChapterData }) =>
      bookApi.updateChapter(bookId, chapterId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: booksKeys.chapters(variables.bookId) })
    },
  })
}

export function useDeleteChapter() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ bookId, chapterId }: { bookId: string; chapterId: string }) =>
      bookApi.deleteChapter(bookId, chapterId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: booksKeys.chapters(variables.bookId) })
    },
  })
}

export function useChapter(bookId: string, chapterId?: string) {
  return useQuery({
    queryKey: [...booksKeys.chapters(bookId), chapterId],
    queryFn: () => bookApi.getChapter(bookId, chapterId!),
    enabled: !!bookId && !!chapterId,
  })
}
