import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FileText, Search, Clock, ArrowLeft, Globe, Tag } from 'lucide-react'
import { docApi } from '../api/doc'
import { EmptyState } from '../components/ui/EmptyState'
import { SkeletonList } from '../components/ui/Skeleton'
import { formatRelativeTime } from '../utils/date'

export const PublicDocListPage: React.FC = () => {
  const navigate = useNavigate()
  const [docs, setDocs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [keyword, setKeyword] = useState('')

  useEffect(() => {
    setLoading(true)
    docApi.getPublicList(keyword || undefined)
      .then((data) => setDocs(data))
      .catch((err) => console.error('加载公开文档失败:', err))
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
                <Globe className="w-5 h-5 text-blue-500" />
                <h1 className="text-lg font-semibold text-slate-900">公开文档</h1>
              </div>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="搜索公开文档..."
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-48 sm:w-64"
              />
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <SkeletonList count={5} />
        ) : docs.length === 0 ? (
          <EmptyState
            icon={<FileText className="w-16 h-16 text-slate-300" />}
            title={keyword ? '未找到匹配的文档' : '暂无公开文档'}
            className="py-20"
          />
        ) : (
          <div className="space-y-3">
            {docs.map((doc) => (
              <div
                key={doc.id}
                className="group bg-white border border-slate-200 rounded-xl p-4 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
                onClick={() => navigate(`/public/docs/${doc.id}`)}
              >
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                    <FileText className="w-5 h-5 text-blue-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-slate-900 mb-1 truncate">{doc.title}</h3>
                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      <span className="flex items-center gap-0.5">
                        <Clock className="w-3 h-3" />
                        {formatRelativeTime(doc.updated_at)}
                      </span>
                      <span>{doc.word_count} 字</span>
                      {(doc as any).author_name && (
                        <span>{(doc as any).author_name}</span>
                      )}
                    </div>
                    {doc.tags && doc.tags.length > 0 && (
                      <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                        {doc.tags.slice(0, 3).map((tag: string) => (
                          <span key={tag} className="inline-flex items-center gap-0.5 px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] rounded-full">
                            <Tag className="w-2.5 h-2.5" />
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
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
