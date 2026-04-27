// User types
export interface User {
  id: string
  email: string
  username: string
  avatar?: string
  created_at: string
}

export interface LoginData {
  email: string
  password: string
}

export interface RegisterData {
  email: string
  username: string
  password: string
}

export interface TokenResponse {
  access_token: string
  token_type: string
  user: User
}

export interface UserStats {
  doc_count: number
  book_count: number
  published_doc_count: number
  total_word_count: number
}

// Folder types
export interface Folder {
  id: string
  name: string
  user_id: string
  parent_id?: string
  path?: string
  depth: number
  sort_order: number
  created_at: string
  updated_at: string
  children?: Folder[]
  isExpanded?: boolean
}

export interface FolderTreeItem extends Folder {
  children: FolderTreeItem[]
}

// Document types
export interface SlateNode {
  type?: string
  text?: string
  children?: SlateNode[]
  [key: string]: any
}

export interface Doc {
  id: string
  user_id: string
  folder_id?: string
  title: string
  content: SlateNode[]
  word_count: number
  tags: string[]
  status: 'draft' | 'published'
  published_at?: string
  version: number
  sort_order: number
  created_at: string
  updated_at: string
}

export interface DocListItem {
  id: string
  title: string
  folder_id?: string
  word_count: number
  tags: string[]
  status: 'draft' | 'published'
  sort_order: number
  updated_at: string
}

export interface DocVersion {
  id: string
  doc_id: string
  content: SlateNode[]
  word_count: number
  version: number
  created_at: string
}

export interface CreateDocData {
  title?: string
  folder_id?: string
  content?: SlateNode[]
}

export interface UpdateDocData {
  title?: string
  content?: SlateNode[]
  folder_id?: string
  tags?: string[]
  status?: 'draft' | 'published'
}

export interface SortUpdateData {
  sort_order: number
  folder_id?: string
}

// View mode
type ViewMode = 'edit' | 'read'

// ==================== Book types ====================

export interface Book {
  id: string
  user_id: string
  title: string
  description: string
  cover_image?: string
  visibility: 'private' | 'public'
  status: 'draft' | 'published'
  word_count: number
  read_count: number
  chapters: ChapterTree[]
  published_at?: string
  created_at: string
  updated_at: string
}

export interface BookListItem {
  id: string
  title: string
  description: string
  cover_image?: string
  visibility: 'private' | 'public'
  status: 'draft' | 'published'
  word_count: number
  read_count: number
  created_at: string
  updated_at: string
}

export interface Chapter {
  id: string
  book_id: string
  parent_id?: string
  user_id: string
  title: string
  path: string
  depth: number
  sort_order: number
  content?: SlateNode[]
  created_at: string
  updated_at: string
}

export interface ChapterTree {
  id: string
  book_id: string
  parent_id?: string
  title: string
  path: string
  depth: number
  sort_order: number
  has_content: boolean
  children: ChapterTree[]
  created_at: string
  updated_at: string
}

export interface CreateBookData {
  title?: string
  description?: string
  cover_image?: string
  visibility?: 'private' | 'public'
}

export interface UpdateBookData {
  title?: string
  description?: string
  cover_image?: string
  visibility?: 'private' | 'public'
  status?: 'draft' | 'published'
}

export interface CreateChapterData {
  title: string
  parent_id?: string
  content?: SlateNode[]
}

export interface UpdateChapterData {
  title?: string
  content?: SlateNode[]
  parent_id?: string
}
