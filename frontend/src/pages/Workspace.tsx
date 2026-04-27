import React, { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  BookOpen, 
  FileText, 
  Plus, 
  Clock,
  ChevronRight,
  BarChart3,
  PenLine,
  Upload
} from 'lucide-react'
import { useAuthStore } from '../stores/authStore'
import { useToast } from '../components/ui/Toast'
import { docApi } from '../api/doc'
import { useDocs } from '../hooks/useDocs'
import { useBooks } from '../hooks/useBooks'
import { useAuthStats } from '../hooks/useAuth'
import { formatRelativeTime } from '../utils/date'
import { importFile, triggerFileSelect } from '../utils/importUtils'

export const WorkspacePage: React.FC = () => {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { show } = useToast()
  const [importing, setImporting] = useState(false)

  const { data: docs = [], isLoading: docsLoading } = useDocs()
  const { data: books = [], isLoading: booksLoading } = useBooks()
  const { data: stats } = useAuthStats()

  const loading = docsLoading || booksLoading

  const recentDocs = useMemo(() => {
    return [...docs].sort(
      (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    ).slice(0, 5)
  }, [docs])

  const recentBooks = useMemo(() => {
    return [...books].sort(
      (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    ).slice(0, 5)
  }, [books])

  const statCards = [
    { label: '云文档', count: stats?.doc_count ?? 0, icon: FileText, color: 'bg-blue-100 text-blue-600', url: '/docs' },
    { label: '云书籍', count: stats?.book_count ?? 0, icon: BookOpen, color: 'bg-amber-100 text-amber-600', url: '/books' },
    { label: '总字数', count: stats?.total_word_count ?? 0, icon: BarChart3, color: 'bg-purple-100 text-purple-600', url: undefined },
    { label: '已发布', count: stats?.published_doc_count ?? 0, icon: PenLine, color: 'bg-green-100 text-green-600', url: '/docs?status=published' },
  ]

  return (
    <div className="h-full overflow-y-auto bg-slate-50">
      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900 mb-2">
            工作台
          </h1>
          <p className="text-slate-600">
            快速开始创作，管理你的知识内容
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 gap-6 mb-10">
          {/* 创建云书籍 */}
          <button
            onClick={() => navigate('/books/new')}
            className="group relative bg-white rounded-xl p-6 border border-slate-200 hover:border-amber-300 hover:shadow-lg transition-all text-left"
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <BookOpen className="w-6 h-6 text-amber-600" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  创建云书籍
                </h3>
                <p className="text-sm text-slate-600">
                  构建结构化的知识体系，支持章节层级管理
                </p>
              </div>
              <Plus className="w-5 h-5 text-slate-400 group-hover:text-amber-500" />
            </div>
          </button>

          {/* 创建云文档 */}
          <button
            onClick={() => navigate('/docs/new')}
            className="group relative bg-white rounded-xl p-6 border border-slate-200 hover:border-blue-300 hover:shadow-lg transition-all text-left"
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <FileText className="w-6 h-6 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  创建云文档
                </h3>
                <p className="text-sm text-slate-600">
                  快速记录想法，灵活的独立文档
                </p>
              </div>
              <Plus className="w-5 h-5 text-slate-400 group-hover:text-blue-500" />
            </div>
          </button>

          {/* 导入文档 */}
          <button
            disabled={importing}
            onClick={() =>
              triggerFileSelect('.md,.txt,.markdown', async (file) => {
                setImporting(true)
                try {
                  const { title, content } = await importFile(file)
                  const doc = await docApi.create({})
                  await docApi.update(doc.id, { title, content })
                  navigate(`/docs/${doc.id}`)
                } catch (err: any) {
                  show(err.message || '导入失败', 'error')
                } finally {
                  setImporting(false)
                }
              })
            }
            className="group relative bg-white rounded-xl p-6 border border-slate-200 hover:border-green-300 hover:shadow-lg transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Upload className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  导入文档
                </h3>
                <p className="text-sm text-slate-600">
                  从本地导入 .md 或 .txt 文件
                </p>
              </div>
              <Upload className="w-5 h-5 text-slate-400 group-hover:text-green-500" />
            </div>
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {statCards.map((stat) => (
            <div key={stat.label} className="bg-white rounded-xl p-4 border border-slate-200" onClick={() => stat.url && navigate(stat.url)} style={{ cursor: stat.url ? 'pointer' : 'default' }}>
              <div className={`w-10 h-10 ${stat.color} rounded-lg flex items-center justify-center mb-3`}>
                <stat.icon className="w-5 h-5" />
              </div>
              <div className="text-2xl font-bold text-slate-900">{stat.count}</div>
              <div className="text-sm text-slate-600">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Recent Content */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Recent Books */}
          <div className="bg-white rounded-xl border border-slate-200">
            <div className="flex items-center justify-between p-4 border-b border-slate-200">
              <h3 className="font-semibold text-slate-900">最近更新的书籍</h3>
              <button
                onClick={() => navigate('/books')}
                className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                查看全部
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <div className="divide-y divide-slate-100">
              {loading ? (
                <div className="p-8 text-center text-slate-400">加载中...</div>
              ) : recentBooks.length === 0 ? (
                <div className="p-8 text-center text-slate-400">
                  <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>还没有创建书籍</p>
                  <button
                    onClick={() => navigate('/books/new')}
                    className="text-blue-600 hover:text-blue-700 text-sm mt-2"
                  >
                    创建第一本
                  </button>
                </div>
              ) : (
                recentBooks.map((book) => (
                  <button
                    key={book.id}
                    onClick={() => navigate(`/books/${book.id}`)}
                    className="w-full flex items-center gap-3 p-4 hover:bg-slate-50 transition-colors text-left"
                  >
                    <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <BookOpen className="w-5 h-5 text-amber-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-slate-900 truncate">
                        {book.title}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <Clock className="w-3 h-3" />
                        {formatRelativeTime(book.updated_at)}
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Recent Docs */}
          <div className="bg-white rounded-xl border border-slate-200">
            <div className="flex items-center justify-between p-4 border-b border-slate-200">
              <h3 className="font-semibold text-slate-900">最近更新的文档</h3>
              <button
                onClick={() => navigate('/docs')}
                className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                查看全部
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <div className="divide-y divide-slate-100">
              {loading ? (
                <div className="p-8 text-center text-slate-400">加载中...</div>
              ) : recentDocs.length === 0 ? (
                <div className="p-8 text-center text-slate-400">
                  <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>还没有创建文档</p>
                  <button
                    onClick={() => navigate('/docs/new')}
                    className="text-blue-600 hover:text-blue-700 text-sm mt-2"
                  >
                    创建第一篇
                  </button>
                </div>
              ) : (
                recentDocs.map((doc) => (
                  <button
                    key={doc.id}
                    onClick={() => navigate(`/docs/${doc.id}`)}
                    className="w-full flex items-center gap-3 p-4 hover:bg-slate-50 transition-colors text-left"
                  >
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <FileText className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-slate-900 truncate">
                        {doc.title}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <Clock className="w-3 h-3" />
                        {formatRelativeTime(doc.updated_at)}
                      </div>
                    </div>
                    {doc.status === 'published' && (
                      <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
                        已发布
                      </span>
                    )}
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
