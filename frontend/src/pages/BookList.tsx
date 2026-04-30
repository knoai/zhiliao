import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { 
  BookOpen, 
  Plus, 
  Search, 
  MoreVertical,
  Clock,
  Globe,
  Lock,
  FileText,
  ArrowLeft,
  Folder,
  Compass
} from 'lucide-react'
import { useBooks, useDeleteBook, useCreateBook } from '../hooks/useBooks'
import { bookApi } from '../api/book'
import { EmptyState } from '../components/ui/EmptyState'
import { SkeletonGrid } from '../components/ui/Skeleton'
import { formatRelativeTime } from '../utils/date'
import { triggerFolderSelect, importFolder, countFiles, getRootFolderName, type ImportFolderNode } from '../utils/importUtils'
import { useToast } from '../components/ui/Toast'

export const BookListPage: React.FC = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { show } = useToast()
  const { data: books = [], isLoading: loading } = useBooks()
  const deleteBook = useDeleteBook()
  const createBook = useCreateBook()
  const [keyword, setKeyword] = useState('')
  const [showMenu, setShowMenu] = useState<string | null>(null)
  const [importing, setImporting] = useState(false)
  const [activeTab, setActiveTab] = useState<'my' | 'discover'>('my')
  const [publicBooks, setPublicBooks] = useState<typeof books>([])
  const [publicLoading, setPublicLoading] = useState(false)

  // 加载公开书籍
  useEffect(() => {
    if (activeTab === 'discover') {
      setPublicLoading(true)
      bookApi.getPublicList(keyword || undefined)
        .then((data) => {
          setPublicBooks(data)
        })
        .catch((err) => {
          console.error('加载公开书籍失败:', err)
        })
        .finally(() => {
          setPublicLoading(false)
        })
    }
  }, [activeTab, keyword])

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这本书吗？所有章节也将被删除。')) return
    deleteBook.mutate(id)
    setShowMenu(null)
  }

  /** 导入文件夹为书籍：根文件夹为书名，内部结构为章节树 */
  const handleImportBook = async () => {
    triggerFolderSelect(async (files) => {
      setImporting(true)
      try {
        show(`正在解析 ${files.length} 个文件...`, 'info')
        const tree = await importFolder(files)
        const total = countFiles(tree)
        if (total === 0) {
          show('未找到支持的文件（.md / .txt）', 'error')
          return
        }

        const bookTitle = getRootFolderName(files)
        show(`正在创建书籍「${bookTitle}」并导入 ${total} 个章节...`, 'info')

        // 1. 创建书籍
        const book = await createBook.mutateAsync({ title: bookTitle })

        // 2. 递归创建章节
        let imported = 0
        const importNode = async (node: ImportFolderNode, parentChapterId?: string) => {
          if (node.type === 'file') {
            await bookApi.createChapter(book.id, {
              title: node.name,
              content: node.content,
              parent_id: parentChapterId,
            })
            imported++
            return
          }
          let currentChapterId = parentChapterId
          // 根节点 name 为空，跳过；有名字的子文件夹创建为章节（空内容，作为父级）
          if (node.name) {
            const chapter = await bookApi.createChapter(book.id, {
              title: node.name,
              parent_id: parentChapterId,
            })
            currentChapterId = chapter.id
          }
          for (const child of node.children) {
            await importNode(child, currentChapterId)
          }
        }

        await importNode(tree)
        queryClient.invalidateQueries({ queryKey: ['books'] })
        show(`成功导入书籍「${bookTitle}」，共 ${imported} 个章节`, 'success')
        navigate(`/books/${book.id}`)
      } catch (err) {
        show((err as Error).message || '导入失败', 'error')
      } finally {
        setImporting(false)
      }
    })
  }

  const isMyTab = activeTab === 'my'
  const displayBooks = isMyTab
    ? books.filter(book => 
        book.title.toLowerCase().includes(keyword.toLowerCase()) ||
        book.description.toLowerCase().includes(keyword.toLowerCase())
      )
    : publicBooks
  const displayLoading = isMyTab ? loading : publicLoading

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/workspace')}
            className="p-2 hover:bg-slate-100 rounded-lg text-slate-600"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-semibold text-slate-900">云书籍</h1>
            <p className="text-sm text-slate-500">管理你的知识库</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isMyTab && (
            <button
              disabled={importing}
              onClick={handleImportBook}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="导入本地文件夹作为书籍，文件夹结构映射为章节" aria-label="导入书籍"
            >
              <Folder className={`w-4 h-4 ${importing ? 'animate-spin' : ''}`} />
              {importing ? '导入中...' : '导入书籍'}
            </button>
          )}
          {isMyTab && (
            <button
              onClick={() => navigate('/books/new')}
              className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
            >
              <Plus className="w-4 h-4" />
              新建书籍
            </button>
          )}
        </div>
      </header>

      {/* Tabs */}
      <div className="flex items-center gap-1 px-6 pt-3 border-b border-slate-200">
        <button
          onClick={() => { setActiveTab('my'); setKeyword('') }}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'my'
              ? 'border-amber-500 text-amber-700'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          我的书籍
        </button>
        <button
          onClick={() => { setActiveTab('discover'); setKeyword('') }}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === 'discover'
              ? 'border-amber-500 text-amber-700'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Compass className="w-3.5 h-3.5" />
          发现
        </button>
      </div>

      {/* Search */}
      <div className="px-6 py-4 border-b border-slate-200">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder={isMyTab ? '搜索我的书籍...' : '搜索公开书籍...'}
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>
      </div>

      {/* Book Grid */}
      <div className="flex-1 overflow-y-auto p-6">
        {displayLoading ? (
          <SkeletonGrid count={8} />
        ) : displayBooks.length === 0 ? (
          <EmptyState
            icon={<BookOpen className="w-16 h-16 text-slate-300" />}
            title={keyword ? '未找到匹配的书籍' : isMyTab ? '还没有创建书籍' : '暂无公开书籍'}
            action={
              isMyTab && !keyword
                ? { label: '创建第一本书', onClick: () => navigate('/books/new') }
                : undefined
            }
            className="h-full"
          />
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {displayBooks.map((book) => (
              <div
                key={book.id}
                className="group bg-white border border-slate-200 rounded-xl overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
                onClick={() => navigate(isMyTab ? `/books/${book.id}` : `/public/books/${book.id}`)}
              >
                {/* Cover */}
                <div className="aspect-[16/10] bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center relative">
                  {book.cover_image ? (
                    <img 
                      src={book.cover_image} 
                      alt={book.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <BookOpen className="w-8 h-8 text-amber-300" />
                  )}
                  {isMyTab && (
                    <div className="absolute top-2 right-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setShowMenu(showMenu === book.id ? null : book.id)
                        }}
                        className="p-1 bg-white/90 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <MoreVertical className="w-3 h-3 text-slate-600" />
                      </button>
                      {showMenu === book.id && (
                        <div className="absolute right-0 top-full mt-1 w-24 bg-white border border-slate-200 rounded shadow z-10">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDelete(book.id)
                            }}
                            className="w-full px-3 py-1.5 text-xs text-left text-red-600 hover:bg-red-50 rounded"
                          >
                            删除
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                  {book.status === 'published' && (
                    <span className="absolute top-2 left-2 px-1.5 py-0.5 bg-green-100 text-green-700 text-[10px] rounded-full">
                      已发布
                    </span>
                  )}
                </div>

                {/* Info */}
                <div className="p-2">
                  <h3 className="font-medium text-sm text-slate-900 mb-0.5 truncate">
                    {book.title}
                  </h3>
                  <p className="text-xs text-slate-500 line-clamp-1 mb-1.5">
                    {(book as any).author_name || book.description || '暂无描述'}
                  </p>
                  <div className="flex items-center justify-between text-[10px] text-slate-400">
                    <div className="flex items-center gap-2">
                      <span className="flex items-center gap-0.5">
                        <Clock className="w-2.5 h-2.5" />
                        {formatRelativeTime(book.updated_at)}
                      </span>
                      <span className="flex items-center gap-0.5">
                        <FileText className="w-2.5 h-2.5" />
                        {book.word_count} 字
                      </span>
                    </div>
                    <span className="flex items-center gap-0.5">
                      {book.visibility === 'public' ? (
                        <>
                          <Globe className="w-2.5 h-2.5" />
                          公开
                        </>
                      ) : (
                        <>
                          <Lock className="w-2.5 h-2.5" />
                          私密
                        </>
                      )}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
