import request from './request'
import type { 
  Book, BookListItem, CreateBookData, UpdateBookData,
  Chapter, ChapterTree, CreateChapterData, UpdateChapterData, SortUpdateData
} from '@/types'

export const bookApi = {
  // ==================== Book APIs ====================
  
  getList(status?: string, keyword?: string): Promise<BookListItem[]> {
    return request.get('/books', {
      params: { status, keyword },
    })
  },

  create(data: CreateBookData): Promise<Book> {
    return request.post('/books', data)
  },

  getById(id: string): Promise<Book> {
    return request.get(`/books/${id}`)
  },

  update(id: string, data: UpdateBookData): Promise<Book> {
    return request.put(`/books/${id}`, data)
  },

  delete(id: string): Promise<void> {
    return request.delete(`/books/${id}`)
  },

  // ==================== Chapter APIs ====================

  getChapters(bookId: string): Promise<ChapterTree[]> {
    return request.get(`/books/${bookId}/chapters`)
  },

  createChapter(bookId: string, data: CreateChapterData): Promise<Chapter> {
    return request.post(`/books/${bookId}/chapters`, data)
  },

  getChapter(bookId: string, chapterId: string): Promise<Chapter> {
    return request.get(`/books/${bookId}/chapters/${chapterId}`)
  },

  updateChapter(bookId: string, chapterId: string, data: UpdateChapterData): Promise<Chapter> {
    return request.put(`/books/${bookId}/chapters/${chapterId}`, data)
  },

  updateChapterSort(bookId: string, chapterId: string, data: SortUpdateData): Promise<Chapter> {
    return request.patch(`/books/${bookId}/chapters/${chapterId}/sort`, data)
  },

  deleteChapter(bookId: string, chapterId: string): Promise<void> {
    return request.delete(`/books/${bookId}/chapters/${chapterId}`)
  },
}
