import React, { useEffect, useState, useCallback, useRef } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { 
  BookOpen, 
  Plus, 
  ChevronRight, 
  ChevronDown,
  ArrowLeft,
  Save,
  Globe,
  Lock,
  FileText,
  Type,
  Palette,
  Upload,
  Menu,
  X
} from 'lucide-react'
import { EmptyState } from '../components/ui/EmptyState'
import { SlateEditor } from '../components/editor/SlateEditor'
import { bookApi } from '../api/book'
import { useBook, useUpdateBook, useBookChapters, useCreateChapter, useUpdateChapter, useDeleteChapter } from '../hooks/useBooks'
import { Descendant } from 'slate'
import type { Book, Chapter, ChapterTree } from '../types'
import { importFile, triggerFileSelect } from '../utils/importUtils'

const DEFAULT_CONTENT: Descendant[] = [
  {
    type: 'paragraph',
    children: [{ text: '' }],
  },
]

interface ChapterItemProps {
  chapter: ChapterTree
  level: number
  selectedId: string | null
  expandedIds: Set<string>
  onSelect: (id: string) => void
  onToggle: (id: string) => void
  onContextMenu: (e: React.MouseEvent, chapter: ChapterTree) => void
}

const ChapterItem: React.FC<ChapterItemProps> = ({
  chapter,
  level,
  selectedId,
  expandedIds,
  onSelect,
  onToggle,
  onContextMenu,
}) => {
  const hasChildren = chapter.children && chapter.children.length > 0
  const isExpanded = expandedIds.has(chapter.id)
  const isSelected = selectedId === chapter.id

  return (
    <div>
      <button
        onClick={() => onSelect(chapter.id)}
        onContextMenu={(e) => onContextMenu(e, chapter)}
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
              onContextMenu={onContextMenu}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// 章节标题输入组件（带防抖保存）
interface ChapterTitleInputProps {
  chapter: Chapter
  bookId: string
  onUpdate: (chapter: Chapter) => void
}

const ChapterTitleInput: React.FC<ChapterTitleInputProps> = ({ chapter, bookId, onUpdate }) => {
  const [title, setTitle] = useState(chapter.title)
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const updateChapter = useUpdateChapter()

  // 当外部 chapter 变化时，更新本地标题
  useEffect(() => {
    setTitle(chapter.title)
  }, [chapter.id, chapter.title])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value
    setTitle(newTitle)

    // 清除之前的定时器
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }

    // 防抖保存
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        const updated = await updateChapter.mutateAsync({
          bookId,
          chapterId: chapter.id,
          data: { title: newTitle }
        })
        onUpdate(updated)
      } catch (error) {
        console.error('保存章节标题失败:', error)
      }
    }, 1000)
  }

  // 组件卸载时清除定时器
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [])

  return (
    <input
      type="text"
      value={title}
      onChange={handleChange}
      className="text-2xl font-bold text-slate-900 bg-transparent border-none focus:outline-none focus:ring-0 w-full p-0"
      placeholder="章节标题"
    />
  )
}

export const BookEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  // 通过路径判断是否为新建模式
  const isNew = location.pathname.endsWith('/new') || id === 'new'

  const { data: bookData, isLoading: bookLoading } = useBook(id || '')
  const { data: serverChapters = [] } = useBookChapters(id || '')
  const updateBookMut = useUpdateBook()
  const createChapterMut = useCreateChapter()
  const updateChapterMut = useUpdateChapter()
  const deleteChapterMut = useDeleteChapter()
  const [chapters, setChapters] = useState<ChapterTree[]>([])
  const [currentChapter, setCurrentChapter] = useState<Chapter | null>(null)
  const [content, setContent] = useState<Descendant[]>(DEFAULT_CONTENT)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
  const [showChapterMenu, setShowChapterMenu] = useState<{x: number, y: number, chapter: ChapterTree} | null>(null)
  const [importing, setImporting] = useState(false)
  const [titleVisible, setTitleVisible] = useState(true)
  const [toolbarVisible, setToolbarVisible] = useState(true)
  const [showMobileSidebar, setShowMobileSidebar] = useState(false)

  const book = bookData || null

  // 同步服务器 chapters 到本地 state
  useEffect(() => {
    if (serverChapters.length > 0) {
      setChapters(serverChapters)
    }
  }, [serverChapters])

  // 加载书籍和章节
  useEffect(() => {
    console.log('BookEdit: id=', id, 'isNew=', isNew)
    if (isNew) {
      setLoading(false)
      return
    }
    if (bookData) {
      setTitle(bookData.title)
      setDescription(bookData.description)
      const bookChapters = bookData.chapters || []
      setChapters(bookChapters)
      
      // 默认展开所有
      const allIds = new Set<string>()
      const collectIds = (list: ChapterTree[]) => {
        list.forEach(ch => {
          allIds.add(ch.id)
          if (ch.children) collectIds(ch.children)
        })
      }
      collectIds(bookChapters)
      setExpandedIds(allIds)
      
      // 默认选中第一个有内容的章节
      const firstContentChapter = findFirstWithContent(bookChapters)
      if (firstContentChapter) {
        loadChapter(firstContentChapter.id)
      }
      setLoading(false)
    }
  }, [id, bookData, isNew])

  // 超时强制停止 loading
  useEffect(() => {
    const timer = setTimeout(() => {
      if (loading) {
        console.log('BookEdit: force stop loading')
        setLoading(false)
      }
    }, 3000)
    return () => clearTimeout(timer)
  }, [])

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
    console.log('加载章节:', chapterId)
    try {
      const chapter = await bookApi.getChapter(id, chapterId)
      console.log('章节数据:', chapter)
      console.log('章节内容:', chapter.content)
      console.log('内容类型:', typeof chapter.content)
      setCurrentChapter(chapter)
      const content = chapter.content || DEFAULT_CONTENT
      console.log('设置内容:', content)
      setContent(content as Descendant[])
    } catch (error) {
      console.error('加载章节失败:', error)
    }
  }

  // 创建书籍
  const handleCreateBook = async () => {
    try {
      const newBook = await bookApi.create({
        title: title || '未命名书籍',
        description,
      })
      navigate(`/books/${newBook.id}`, { replace: true })
    } catch (error) {
      console.error('创建失败:', error)
    }
  }

  // 保存书籍信息
  const handleSaveBook = async () => {
    if (!book) return
    setSaving(true)
    try {
      await updateBookMut.mutateAsync({ id: book.id, data: { title, description } })
    } catch (error) {
      console.error('保存失败:', error)
    } finally {
      setSaving(false)
    }
  }

  // 保存章节内容
  const handleSaveChapter = useCallback(
    async (newContent: Descendant[]) => {
      if (!book || !currentChapter) return
      
      try {
        await updateChapterMut.mutateAsync({
          bookId: book.id,
          chapterId: currentChapter.id,
          data: { content: newContent },
        })
      } catch (error) {
        console.error('保存章节失败:', error)
      }
    },
    [book, currentChapter, updateChapterMut]
  )

  // 内容变更
  const handleContentChange = useCallback(
    (newContent: Descendant[]) => {
      setContent(newContent)
      // 防抖保存
      const timeout = setTimeout(() => {
        handleSaveChapter(newContent)
      }, 2000)
      return () => clearTimeout(timeout)
    },
    [handleSaveChapter]
  )

  // 创建章节
  const handleCreateChapter = async (parentId?: string) => {
    if (!book) return
    try {
      const newChapter = await createChapterMut.mutateAsync({
        bookId: book.id,
        data: { title: '新篇', parent_id: parentId },
      })
      // 选中新章节，内容重置为空
      setCurrentChapter(newChapter)
      setContent(DEFAULT_CONTENT)
    } catch (error) {
      console.error('创建章节失败:', error)
    }
  }

  // 删除
  const handleDeleteChapter = async (chapterId: string) => {
    if (!book) return
    if (!confirm('确定要删除这个章节吗？')) return
    try {
      await deleteChapterMut.mutateAsync({ bookId: book.id, chapterId })
      if (currentChapter?.id === chapterId) {
        setCurrentChapter(null)
        setContent(DEFAULT_CONTENT)
      }
    } catch (error) {
      console.error('删除失败:', error)
    }
    setShowChapterMenu(null)
  }

  // 切换展开
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

  // 右键菜单
  const handleContextMenu = (e: React.MouseEvent, chapter: ChapterTree) => {
    e.preventDefault()
    setShowChapterMenu({ x: e.clientX, y: e.clientY, chapter })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
      </div>
    )
  }

  // 新建书籍模式
  if (isNew) {
    return (
      <div className="h-full flex flex-col bg-white">
        {/* Header */}
        <header className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/books')}
              className="p-2 hover:bg-slate-100 rounded-lg text-slate-600"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-lg font-semibold text-slate-900">新建书籍</h1>
          </div>
          <button
            onClick={handleCreateBook}
            disabled={!title.trim()}
            className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Save className="w-4 h-4" />
            创建
          </button>
        </header>

        {/* Form */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-2xl mx-auto">
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  书籍标题
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="输入书籍标题"
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  书籍描述
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="输入书籍描述（可选）"
                  rows={4}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col bg-white relative">
      {/* Floating Header Toggle Button */}
      {/* <button
        onClick={() => setHeaderVisible(!headerVisible)}
        className={`fixed top-16 left-0 z-50 w-5 h-16 flex items-center justify-center bg-white/50 backdrop-blur shadow-sm border-y border-r border-slate-200/50 text-slate-400 hover:text-slate-600 hover:bg-white/80 transition-all ${
          headerVisible ? 'rounded-r-md' : 'rounded-r-md'
        }`}
        title={headerVisible ? '隐藏菜单' : '显示菜单'}
      >
        <ChevronRight className={`w-4 h-4 transition-transform duration-300 ${headerVisible ? 'rotate-180' : ''}`} />
      </button> */}

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Chapter Tree Sidebar - Desktop */}
        <aside className="hidden md:flex w-64 border-r border-slate-200 bg-slate-50 flex-col">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
              <button
                onClick={() => navigate('/books')}
                className="p-2 hover:bg-slate-100 rounded-lg text-slate-600"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <span className="text-slate-900 font-semibold truncate max-w-[120px]">{title || '未命名书籍'}</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                disabled={importing}
                onClick={() =>
                  triggerFileSelect('.md,.txt,.markdown', async (file) => {
                    if (!book) return
                    setImporting(true)
                    try {
                      const { title, content } = await importFile(file)
                      const newChapter = await bookApi.createChapter(book.id, {
                        title,
                        content,
                      })
                      const updatedChapters = await bookApi.getChapters(book.id)
                      setChapters(updatedChapters)
                      setCurrentChapter(newChapter)
                      setContent(content)
                    } catch (err: any) {
                      alert(err.message || '导入失败')
                    } finally {
                      setImporting(false)
                    }
                  })
                }
                className="p-1 hover:bg-slate-200 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                title="导入章节"
              >
                <Upload className={`w-4 h-4 text-slate-500 ${importing ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={() => handleCreateChapter()}
                className="p-1 hover:bg-slate-200 rounded"
              >
                <Plus className="w-4 h-4 text-slate-500" />
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            {chapters.length === 0 ? (
              <EmptyState
                title="这本书还没有章节"
                description="点击上方 + 创建第一个章节，开始你的写作之旅"
                action={{ label: '创建第一个章节', onClick: () => handleCreateChapter() }}
                className="py-8"
              />
            ) : (
              chapters.map((chapter) => (
                <ChapterItem
                  key={chapter.id}
                  chapter={chapter}
                  level={0}
                  selectedId={currentChapter?.id || null}
                  expandedIds={expandedIds}
                  onSelect={loadChapter}
                  onToggle={handleToggle}
                  onContextMenu={handleContextMenu}
                />
              ))
            )}
          </div>
        </aside>

        {/* Editor */}
        <div className="flex-1 flex flex-col overflow-hidden relative">
          {/* Mobile Sidebar Toggle + Floating Controls */}
          <div className="absolute top-4 left-4 z-30 md:hidden">
            <button
              onClick={() => setShowMobileSidebar(true)}
              className="p-2 rounded-lg border shadow-sm bg-white/80 border-slate-200 text-slate-600 hover:bg-white"
              title="章节列表"
            >
              <Menu className="w-4 h-4" />
            </button>
          </div>
          {currentChapter && (
            <div className="absolute top-4 right-4 z-30 flex items-center gap-2">
              <button
                onClick={() => setTitleVisible(!titleVisible)}
                className={`p-2 rounded-lg border shadow-sm transition-all ${
                  titleVisible 
                    ? 'bg-blue-50/80 border-blue-200 text-blue-600' 
                    : 'bg-white/50 border-slate-200/50 text-slate-500 hover:bg-white/80 hover:text-slate-700'
                }`}
                title={titleVisible ? '隐藏标题' : '显示标题'}
              >
                <Type className="w-4 h-4" />
              </button>
              <button
                onClick={() => setToolbarVisible(!toolbarVisible)}
                className={`p-2 rounded-lg border shadow-sm transition-all ${
                  toolbarVisible 
                    ? 'bg-amber-50/80 border-amber-200 text-amber-600' 
                    : 'bg-white/50 border-slate-200/50 text-slate-500 hover:bg-white/80 hover:text-slate-700'
                }`}
                title={toolbarVisible ? '隐藏工具栏' : '显示工具栏'}
              >
                <Palette className="w-4 h-4" />
              </button>
            </div>
          )}

          {currentChapter ? (
            <>
              {/* Chapter Header - Collapsible */}
              <div 
                className={`border-b border-slate-100 bg-white transition-all duration-300 overflow-hidden ${
                  titleVisible ? 'max-h-24 opacity-100' : 'max-h-0 opacity-0'
                }`}
              >
                <div className="px-8 py-4">
                  <ChapterTitleInput 
                    chapter={currentChapter}
                    bookId={book!.id}
                    onUpdate={(updated) => {
                      setCurrentChapter(updated)
                    }}
                  />
                </div>
              </div>
              {/* Slate Editor */}
              <div className="flex-1 overflow-hidden">
                <SlateEditor
                  value={content}
                  onChange={handleContentChange}
                  placeholder="开始写作..."
                  showToolbar={toolbarVisible}
                />
              </div>
            </>
          ) : (
            <EmptyState
              icon={<BookOpen className="w-16 h-16 text-slate-300" />}
              title="选择一个章节开始编辑"
              description={chapters.length > 0 ? '在左侧章节树中选择一个章节，或创建新篇' : '先创建第一个章节'}
              action={
                chapters.length > 0
                  ? { label: '创建新篇', onClick: () => handleCreateChapter() }
                  : undefined
              }
              className="h-full"
            />
          )}
        </div>
      </div>

      {/* Mobile Sidebar Drawer */}
      {showMobileSidebar && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/30 md:hidden"
            onClick={() => setShowMobileSidebar(false)}
          />
          <div className="fixed left-0 top-0 bottom-0 z-50 w-64 bg-slate-50 border-r border-slate-200 flex flex-col md:hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
              <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                <button
                  onClick={() => navigate('/books')}
                  className="p-2 hover:bg-slate-100 rounded-lg text-slate-600"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <span className="text-slate-900 font-semibold truncate max-w-[120px]">{title || '未命名书籍'}</span>
              </div>
              <button
                onClick={() => setShowMobileSidebar(false)}
                className="p-2 hover:bg-slate-100 rounded-lg text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-2">
              {chapters.length === 0 ? (
                <EmptyState
                  title="这本书还没有章节"
                  description="点击上方 + 创建第一个章节，开始你的写作之旅"
                  action={{ label: '创建第一个章节', onClick: () => handleCreateChapter() }}
                  className="py-8"
                />
              ) : (
                chapters.map((chapter) => (
                  <ChapterItem
                    key={chapter.id}
                    chapter={chapter}
                    level={0}
                    selectedId={currentChapter?.id || null}
                    expandedIds={expandedIds}
                    onSelect={(id) => { loadChapter(id); setShowMobileSidebar(false); }}
                    onToggle={handleToggle}
                    onContextMenu={handleContextMenu}
                  />
                ))
              )}
            </div>
          </div>
        </>
      )}

      {/* Context Menu */}
      {showChapterMenu && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowChapterMenu(null)}
          />
          <div
            className="fixed z-50 w-40 bg-white border border-slate-200 rounded-lg shadow-lg py-1"
            style={{ left: showChapterMenu.x, top: showChapterMenu.y }}
          >
            <button
              onClick={() => {
                handleCreateChapter(showChapterMenu.chapter.id)
                setShowChapterMenu(null)
              }}
              className="w-full px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-100"
            >
              添加
            </button>
            <button
              onClick={() => handleDeleteChapter(showChapterMenu.chapter.id)}
              className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50"
            >
              删除
            </button>
          </div>
        </>
      )}
    </div>
  )
}
