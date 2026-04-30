import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Globe, FileText, Edit3, Sparkles } from 'lucide-react'
import { SlateEditor } from '../components/editor/SlateEditor'
import { docApi } from '../api/doc'
import { useAuthStore } from '../stores/authStore'
import { Descendant } from 'slate'
import type { Doc } from '../types'
import { DEFAULT_CONTENT } from '../constants/editor'
import { EmptyState } from '../components/ui/EmptyState'

export const PublicDocReadPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user, isAuthenticated } = useAuthStore()
  const [doc, setDoc] = useState<Doc | null>(null)
  const [content, setContent] = useState<Descendant[]>(DEFAULT_CONTENT)
  const [loading, setLoading] = useState(true)

  const isAuthor = isAuthenticated && user && doc && String((doc as any).user_id || doc.user_id) === String(user.id)

  useEffect(() => {
    if (!id) return
    const loadDoc = async () => {
      try {
        const docData = await docApi.getPublicById(id)
        setDoc(docData)
        setContent((docData.content || DEFAULT_CONTENT) as Descendant[])
      } catch (error) {
        console.error('加载公开文档失败:', error)
      } finally {
        setLoading(false)
      }
    }
    loadDoc()
  }, [id])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-white">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (!doc) {
    return (
      <div className="flex items-center justify-center h-screen bg-white">
        <EmptyState
          icon={<FileText className="w-16 h-16 text-slate-300" />}
          title="文档不存在或未公开"
          description="这篇文档可能已被删除或设为私密"
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
            onClick={() => navigate('/public/docs')}
            className="p-2 hover:bg-slate-100 rounded-lg text-slate-600"
            title="返回公开文档"
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
            <span className="text-sm font-medium text-slate-900 truncate max-w-[200px] sm:max-w-[400px]">
              {doc.title}
            </span>
            <span className="flex items-center gap-0.5 px-1.5 py-0.5 bg-blue-50 text-blue-600 text-[10px] rounded-full border border-blue-100">
              <Globe className="w-2.5 h-2.5" />
              公开
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {(doc as any).author_name && (
            <span className="text-xs text-slate-500 hidden sm:inline">
              作者：{(doc as any).author_name}
            </span>
          )}
          {isAuthor && (
            <button
              onClick={() => navigate(`/docs/${doc.id}`)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
            >
              <Edit3 className="w-3.5 h-3.5" />
              编辑
            </button>
          )}
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        <SlateEditor
          value={content}
          onChange={() => {}}
          readOnly={true}
          showToolbar={false}
        />
      </div>
    </div>
  )
}
