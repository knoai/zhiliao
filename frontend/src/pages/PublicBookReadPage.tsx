import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { 
  BookOpen, 
  ChevronRight, 
  ChevronDown,
  ArrowLeft,
  Globe,
  FileText,
  Edit3,
  Sparkles
} from 'lucide-react'
import { SlateEditor } from '../components/editor/SlateEditor'
import { bookApi } from '../api/book'
import { useAuthStore } from '../stores/authStore'
import { Descendant } from 'slate'
import type { Book, ChapterTree } from '../types'
import { DEFAULT_CONTENT } from '../constants/editor'
import { EmptyState } from '../components/ui/EmptyState'

interface ChapterItemProps {
  chapter: ChapterTree
  level: number
  selectedId: string | null
  expandedIds: Set<string>
  onSelect: (id: string) => void
  onToggle: (id: string) => void
}

const ChapterItem: React.FC<ChapterItemProps> = ({
  chapter,
  level,
  selectedId,
  expandedIds,
  onSelect,
  onToggle,
}) => {
  const hasChildren = chapter.children && chapter.children.length > 0
  const isExpanded = expandedIds.has(chapter.id)
  const isSelected = selectedId === chapter.id

  return (
    <div>
      <button
        onClick={() => onSelect(chapter.id)}
        className={`w-full flex items-center gap-1 px-2 py-1.5 text-sm rounded-md transition-colors ${
          isSelected
            ? 'bg-amber-100 text-amber-900'
            : 'hover:bg-slate-100 text-slate-700'
        }`}
        style={{ paddingLeft: `${level * 12 + 8}px` }}
      >
        {hasChildren ? (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onToggle(chapter.id)
            }}
            className="p-0.5 hover:bg-slate-200 rounded"
          >
            {isExpanded ? (
              <ChevronDown className="w-3 h-3" />
            ) : (
              <ChevronRight className="w-3 h-3" />
            )}
          </button>
        ) : (
          <span className="w-4" />
        )}
        <FileText className={`w-4 h-4 flex-shrink-0 ${chapter.has_content ? 'text-amber-500' : 'text-slate-400'}`} />
        <span className="truncate flex-1 text-left">{chapter.title || '未命名章节'}</span>
      </button>
      {hasChildren && isExpanded && (
        <div>
          {chapter.children.map((child) => (
            <ChapterItem
              key={child.id}
              chapter={child}
              level={level + 1}
              selectedId={selectedId}
              expandedIds={expandedIds}
              onSelect={onSelect}
              onToggle={onToggle}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export const PublicBookReadPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user, isAuthenticated } = useAuthStore()
  const [book, setBook] = useState<Book | null>(null)
  const [chapters, setChapters] = useState<ChapterTree[]>([])
  const [currentChapterId, setCurrentChapterId] = useState<string | null>(null)
  const [currentChapterTitle, setCurrentChapterTitle] = useState('')
  const [content, setContent] = useState<Descendant[]>(DEFAULT_CONTENT)
  const [loading, setLoading] = useState(true)
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())

  const isAuthor = isAuthenticated && user && book && String((book as any).user_id || book.user_id) === String(user.id)

  // 加载书籍和章节
  useEffect(() => {
    if (!id) return
    const loadBook = async () => {
      try {
        const bookData = await bookApi.getPublicById(id)
        setBook(bookData)
        const chapterTree = await bookApi.getPublicChapters(id)
        setChapters(chapterTree)
        
        // 默认展开所有
        const allIds = new Set<string>()
        const collectIds = (list: ChapterTree[]) => {
          list.forEach(ch => {
            allIds.add(ch.id)
            if (ch.children) collectIds(ch.children)
          })
        }
        collectIds(chapterTree)
        setExpandedIds(allIds)
        
        // 默认选中第一个有内容的章节
        const firstContent = findFirstWithContent(chapterTree)
        if (firstContent) {
          await loadChapter(firstContent.id)
        }
      } catch (error) {
        console.error('加载公开书籍失败:', error)
      } finally {
        setLoading(false)
      }
    }
    loadBook()
  }, [id])

  const findFirstWithContent = (list: ChapterTree[]): ChapterTree | null => {
    for (const ch of list) {
      if (ch.has_content) return ch
      if (ch.children) {
        const found = findFirstWithContent(ch.children)
        if (found) return found
      }
    }
    return null
  }

  const loadChapter = async (chapterId: string) => {
    if (!id) return
    try {
      const chapter = await bookApi.getPublicChapter(id, chapterId)
      setCurrentChapterId(chapterId)
      setCurrentChapterTitle(chapter.title)
      setContent((chapter.content || DEFAULT_CONTENT) as Descendant[])
    } catch (error) {
      console.error('加载章节失败:', error)
    }
  }

  const handleToggle = (chapterId: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(chapterId)) {
        next.delete(chapterId)
      } else {
        next.add(chapterId)
      }
      return next
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-white">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
      </div>
    )
  }

  if (!book) {
    return (
      <div className="flex items-center justify-center h-screen bg-white">
        <EmptyState
          icon={<BookOpen className="w-16 h-16 text-slate-300" />}
          title="书籍不存在或未公开"
          description="这本书可能已被删除或设为私密"
          className="h-full"
        />
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-white">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-white">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/')}
            className="p-2 hover:bg-slate-100 rounded-lg text-slate-600"
            title="返回首页"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="font-semibold text-slate-900 hidden sm:block">知了云笔记</span>
          </div>
          <div className="h-6 w-px bg-slate-200 mx-1" />
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-sm font-medium text-slate-900 truncate max-w-[200px] sm:max-w-[300px]">
              {book.title}
            </span>
            <span className="flex items-center gap-0.5 px-1.5 py-0.5 bg-amber-50 text-amber-600 text-[10px] rounded-full border border-amber-100">
              <Globe className="w-2.5 h-2.5" />
              公开
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {(book as any).author_name && (
            <span className="text-xs text-slate-500 hidden sm:inline">
              作者：{(book as any).author_name}
            </span>
          )}
          {isAuthor && (
            <button
              onClick={() => navigate(`/books/${book.id}`)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors text-sm"
            >
              <Edit3 className="w-3.5 h-3.5" />
              编辑
            </button>
          )}
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Chapter Tree Sidebar */}
        <aside className="hidden md:flex w-64 border-r border-slate-200 bg-slate-50 flex-col">
          <div className="flex items-center px-4 py-3 border-b border-slate-200">
            <span className="text-sm font-medium text-slate-700">目录</span>
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            {chapters.length === 0 ? (
              <EmptyState
                title="这本书还没有章节"
                description="作者尚未添加任何内容"
                className="py-8"
              />
            ) : (
              chapters.map((chapter) => (
                <ChapterItem
                  key={chapter.id}
                  chapter={chapter}
                  level={0}
                  selectedId={currentChapterId}
                  expandedIds={expandedIds}
                  onSelect={loadChapter}
                  onToggle={handleToggle}
                />
              ))
            )}
          </div>
        </aside>

        {/* Editor / Reader */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {currentChapterId ? (
            <>
              {/* Chapter Title */}
              <div className="border-b border-slate-100 bg-white">
                <div className="px-8 py-4">
                  <h1 className="text-2xl font-bold text-slate-900">
                    {currentChapterTitle || '未命名章节'}
                  </h1>
                </div>
              </div>
              {/* Slate Editor ReadOnly */}
              <div className="flex-1 overflow-hidden">
                <SlateEditor
                  value={content}
                  onChange={() => {}}
                  readOnly={true}
                  showToolbar={false}
                />
              </div>
            </>
          ) : (
            <EmptyState
              icon={<BookOpen className="w-16 h-16 text-slate-300" />}
              title="选择一个章节开始阅读"
              description={chapters.length > 0 ? '在左侧章节树中选择一个章节' : '这本书还没有内容'}
              className="h-full"
            />
          )}
        </div>
      </div>
    </div>
  )
}
