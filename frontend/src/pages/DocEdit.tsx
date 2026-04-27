import React, { useEffect, useState, useCallback, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Descendant } from 'slate'
import { useDocStore } from '../stores/docStore'
import { useAuthStore } from '../stores/authStore'
import { SlateEditor } from '../components/editor/SlateEditor'
import {
  DocEditHeader,
  DocSidebar,
  DocCanvas,
  DocTitle,
  DocFooter,
  DocOutlinePanel,
} from '../components/doc'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { docApi } from '../api/doc'
import type { DocVersion } from '../types'
import { importFile } from '../utils/importUtils'

const DEFAULT_CONTENT: Descendant[] = [
  {
    type: 'paragraph',
    children: [{ text: '' }],
  },
]

interface DocDraft {
  title: string
  content: Descendant[]
  savedAt: string
}

export const DocEditPage: React.FC = () => {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const { currentDoc, docs, fetchDoc, fetchDocs, createDoc, updateDoc, deleteDoc, readMode, toggleReadMode } = useDocStore()
  const { user } = useAuthStore()

  const [title, setTitle] = useState('')
  const [content, setContent] = useState<Descendant[]>(DEFAULT_CONTENT)
  const [status, setStatus] = useState<'draft' | 'published'>('draft')
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [showHistory, setShowHistory] = useState(false)
  const [versions, setVersions] = useState<DocVersion[]>([])
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [importing, setImporting] = useState(false)

  const titleSaveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const contentSaveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const draftTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isNewDoc = !id

  // Load document and docs list
  useEffect(() => {
    fetchDocs()

    if (id) {
      fetchDoc(id).then((doc) => {
        if (doc) {
          // 尝试恢复本地草稿
          const draftRaw = localStorage.getItem(`doc-draft-${id}`)
          if (draftRaw) {
            try {
              const draft: DocDraft = JSON.parse(draftRaw)
              setTitle(draft.title || doc.title || '无标题文档')
              const draftContent = draft.content
              if (Array.isArray(draftContent) && draftContent.length > 0) {
                setContent(draftContent as Descendant[])
              } else {
                const docContent = doc.content
                setContent(Array.isArray(docContent) && docContent.length > 0 ? docContent as Descendant[] : DEFAULT_CONTENT)
              }
            } catch {
              // 草稿解析失败，回退到服务器数据
              setTitle(doc.title || '无标题文档')
              const docContent = doc.content
              setContent(Array.isArray(docContent) && docContent.length > 0 ? docContent as Descendant[] : DEFAULT_CONTENT)
            }
          } else {
            setTitle(doc.title || '无标题文档')
            const docContent = doc.content
            setContent(Array.isArray(docContent) && docContent.length > 0 ? docContent as Descendant[] : DEFAULT_CONTENT)
          }
          setStatus(doc.status || 'draft')
          setLastSaved(new Date(doc.updated_at))
        }
      })
    } else {
      createDoc().then((doc) => {
        navigate(`/docs/${doc.id}`, { replace: true })
      })
    }
  }, [id])

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (titleSaveTimeoutRef.current) clearTimeout(titleSaveTimeoutRef.current)
      if (contentSaveTimeoutRef.current) clearTimeout(contentSaveTimeoutRef.current)
      if (draftTimeoutRef.current) clearTimeout(draftTimeoutRef.current)
    }
  }, [])

  // === 自动保存核心逻辑 ===
  const saveDoc = useCallback(async () => {
    if (!id) return

    setSaveStatus('saving')
    try {
      // 保存时移除 heading id
      const cleanContent = content.map((node: any) => {
        if (node.type?.startsWith('heading-')) {
          const { id: _id, ...rest } = node
          return rest
        }
        return node
      })
      await updateDoc(id, { title, content: cleanContent })
      setLastSaved(new Date())
      setSaveStatus('saved')
      // 保存成功后清除本地草稿
      localStorage.removeItem(`doc-draft-${id}`)
    } catch (error) {
      console.error('保存失败:', error)
      setSaveStatus('error')
    }
  }, [id, title, content, updateDoc])

  const saveDraft = useCallback(() => {
    if (!id) return
    const draft: DocDraft = { title, content, savedAt: new Date().toISOString() }
    localStorage.setItem(`doc-draft-${id}`, JSON.stringify(draft))
  }, [id, title, content])

  const handleTitleChange = (newTitle: string) => {
    setTitle(newTitle)

    if (titleSaveTimeoutRef.current) {
      clearTimeout(titleSaveTimeoutRef.current)
    }
    titleSaveTimeoutRef.current = setTimeout(() => {
      saveDoc()
    }, 1000)

    if (draftTimeoutRef.current) {
      clearTimeout(draftTimeoutRef.current)
    }
    draftTimeoutRef.current = setTimeout(() => {
      saveDraft()
    }, 1000)
  }

  const handleContentChange = (newContent: Descendant[]) => {
    setContent(newContent)

    if (contentSaveTimeoutRef.current) {
      clearTimeout(contentSaveTimeoutRef.current)
    }
    contentSaveTimeoutRef.current = setTimeout(() => {
      saveDoc()
    }, 2000)

    if (draftTimeoutRef.current) {
      clearTimeout(draftTimeoutRef.current)
    }
    draftTimeoutRef.current = setTimeout(() => {
      saveDraft()
    }, 1000)
  }

  // 手动保存快捷键 ⌘+S / Ctrl+S
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault()
        saveDoc()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [saveDoc])

  const handlePublish = async () => {
    if (!id) return
    await saveDoc()
    await updateDoc(id, { status: 'published' })
    setStatus('published')
  }

  const handleUnpublish = async () => {
    if (!id) return
    await updateDoc(id, { status: 'draft' })
    setStatus('draft')
  }

  const handleDelete = async () => {
    if (!id) return
    if (confirm('确定要删除这篇文档吗？')) {
      await deleteDoc(id)
      navigate('/docs')
    }
  }

  const loadVersions = async () => {
    if (!id) return
    const data = await docApi.getVersions(id)
    setVersions(data)
    setShowHistory(true)
  }

  const handleCreateNewDoc = async () => {
    const doc = await createDoc()
    navigate(`/docs/${doc.id}`)
  }

  const handleImport = async (file: File) => {
    if (!id) return
    if (!confirm('导入将覆盖当前文档的现有内容，是否继续？')) return
    setImporting(true)
    try {
      const { title: importTitle, content: importContent } = await importFile(file)
      setTitle(importTitle)
      setContent(importContent)
      await updateDoc(id, { title: importTitle, content: importContent })
      setLastSaved(new Date())
      setSaveStatus('saved')
      localStorage.removeItem(`doc-draft-${id}`)
    } catch (err: any) {
      alert(err.message || '导入失败')
    } finally {
      setImporting(false)
    }
  }

  return (
    <div className="flex flex-col h-full bg-white overflow-hidden">
      {/* Header */}
      <DocEditHeader
        title={title}
        status={status}
        saveStatus={saveStatus}
        lastSaved={lastSaved}
        readMode={readMode}
        onToggleReadMode={toggleReadMode}
        onPublish={handlePublish}
        onUnpublish={handleUnpublish}
        onSave={saveDoc}
        onDelete={handleDelete}
        onLoadVersions={loadVersions}
        onImport={handleImport}
        importing={importing}
        sidebarCollapsed={sidebarCollapsed}
        onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* Main Body */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Sidebar */}
        <DocSidebar
          docs={docs}
          currentDocId={id}
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
          onCreateDoc={handleCreateNewDoc}
        />

        {/* Center Canvas */}
        <DocCanvas>
          <DocTitle
            value={title}
            onChange={handleTitleChange}
            readOnly={readMode}
          />

          <SlateEditor
            key={id}
            value={content}
            onChange={handleContentChange}
            placeholder="从这里开始写正文..."
            readOnly={readMode}
            showToolbar={!readMode}
          />

          {/* Footer Info - always show at bottom of paper */}
          <DocFooter
            author={user?.username || '-'}
            createdAt={currentDoc?.created_at}
            updatedAt={currentDoc?.updated_at}
            wordCount={currentDoc?.word_count}
          />
        </DocCanvas>

        {/* Right Outline Panel */}
        <DocOutlinePanel
          content={content}
          readMode={readMode}
          author={user?.username}
          createdAt={currentDoc?.created_at}
          updatedAt={currentDoc?.updated_at}
          wordCount={currentDoc?.word_count}
        />
      </div>

      {/* History Drawer */}
      {showHistory && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            className="absolute inset-0 bg-black/30"
            onClick={() => setShowHistory(false)}
          />
          <div className="relative w-80 bg-white h-full shadow-xl overflow-y-auto">
            <div className="p-4 border-b border-gray-200">
              <h3 className="font-medium text-gray-900">版本历史</h3>
            </div>
            <div className="p-4 space-y-3">
              {versions.map((version) => (
                <div key={version.id} className="p-3 bg-gray-50 rounded-lg text-sm">
                  <div className="font-medium text-gray-900">版本 {version.version}</div>
                  <div className="text-gray-500 mt-1">
                    {format(new Date(version.created_at), 'yyyy-MM-dd HH:mm:ss', {
                      locale: zhCN,
                    })}
                  </div>
                  <div className="text-gray-500">{version.word_count} 字</div>
                </div>
              ))}
              {versions.length === 0 && (
                <div className="text-center text-gray-500 py-8">暂无历史版本</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
