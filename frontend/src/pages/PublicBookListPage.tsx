import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BookOpen, Search, Clock, FileText, ArrowLeft, Globe } from 'lucide-react'
import { bookApi } from '../api/book'
import { EmptyState } from '../components/ui/EmptyState'
import { SkeletonGrid } from '../components/ui/Skeleton'
import { formatRelativeTime } from '../utils/date'

export const PublicBookListPage: React.FC = () => {
  const navigate = useNavigate()
  const [books, setBooks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [keyword, setKeyword] = useState('')

  useEffect(() => {
    setLoading(true)
    bookApi.getPublicList(keyword || undefined)
      .then((data) => setBooks(data))
      .catch((err) => console.error('加载公开书籍失败:', err))
      .finally(() => setLoading(false))
  }, [keyword])

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/')}
                className="p-2 hover:bg-slate-100 rounded-lg text-slate-600"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-amber-500" />
                <h1 className="text-lg font-semibold text-slate-900">公开书籍</h1>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="搜索公开书籍..."
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 w-48 sm:w-64"
                />
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <SkeletonGrid count={8} />
        ) : books.length === 0 ? (
          <EmptyState
            icon={<BookOpen className="w-16 h-16 text-slate-300" />}
            title={keyword ? '未找到匹配的书籍' : '暂无公开书籍'}
            className="py-20"
          />
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            {books.map((book) => (
              <div
                key={book.id}
                className="group bg-white border border-slate-200 rounded-xl overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
                onClick={() => navigate(`/public/books/${book.id}`)}
              >
                <div className="aspect-[16/10] bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center relative">
                  {book.cover_image ? (
                    <img src={book.cover_image} alt={book.title} className="w-full h-full object-cover" />
                  ) : (
                    <BookOpen className="w-8 h-8 text-amber-300" />
                  )}
                  {book.status === 'published' && (
                    <span className="absolute top-2 left-2 px-1.5 py-0.5 bg-green-100 text-green-700 text-[10px] rounded-full">
                      已发布
                    </span>
                  )}
                </div>
                <div className="p-2">
                  <h3 className="font-medium text-sm text-slate-900 mb-0.5 truncate">{book.title}</h3>
                  <p className="text-xs text-slate-500 line-clamp-1 mb-1.5">
                    {(book as any).author_name || book.description || '暂无描述'}
                  </p>
                  <div className="flex items-center justify-between text-[10px] text-slate-400">
                    <span className="flex items-center gap-0.5">
                      <Clock className="w-2.5 h-2.5" />
                      {formatRelativeTime(book.updated_at)}
                    </span>
                    <span className="flex items-center gap-0.5">
                      <FileText className="w-2.5 h-2.5" />
                      {book.word_count} 字
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
