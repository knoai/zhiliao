import React, { useEffect, useState, useCallback, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Descendant } from 'slate'
import { useDocStore } from '../stores/docStore'
import { useAuthStore } from '../stores/authStore'
import { SlateEditor } from '../components/editor/SlateEditor'
import { SlateRenderer } from '../components/editor/SlateRenderer'
import { Modal } from '../components/ui/Modal'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { useToast } from '../components/ui/Toast'
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
import { useDoc, useDocs, useCreateDoc, useUpdateDoc, useDeleteDoc } from '../hooks/useDocs'
import type { DocVersion } from '../types'
import { importFile } from '../utils/importUtils'
import { DEFAULT_CONTENT } from '../constants/editor'

interface DocDraft {
  title: string
  content: Descendant[]
  savedAt: string
}

export const DocEditPage: React.FC = () => {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const { readMode, toggleReadMode } = useDocStore()
  const { user } = useAuthStore()
  const { show } = useToast()
  const { data: docs = [] } = useDocs()
  const { data: docData } = useDoc(id || '')
  const createDocMut = useCreateDoc()
  const updateDocMut = useUpdateDoc()
  const deleteDocMut = useDeleteDoc()

  const [title, setTitle] = useState('')
  const [content, setContent] = useState<Descendant[]>(DEFAULT_CONTENT)
  const [status, setStatus] = useState<'draft' | 'published'>('draft')
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [showHistory, setShowHistory] = useState(false)
  const [versions, setVersions] = useState<DocVersion[]>([])
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => window.innerWidth < 1024)
  const [outlineOpen, setOutlineOpen] = useState(false)
  const [importing, setImporting] = useState(false)

  // 监听窗口大小变化，自动折叠侧边栏
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setSidebarCollapsed(true)
        setOutlineOpen(false)
      }
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Version preview & restore
  const [previewVersion, setPreviewVersion] = useState<DocVersion | null>(null)
  const [restoreTarget, setRestoreTarget] = useState<DocVersion | null>(null)

  const titleSaveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const contentSaveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const draftTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isNewDoc = !id

  // Load document and docs list
  useEffect(() => {
    if (!id) {
      createDocMut.mutateAsync({}).then((doc) => {
        navigate(`/docs/${doc.id}`, { replace: true })
      })
      return
    }
    if (docData) {
      // 尝试恢复本地草稿
      const draftRaw = localStorage.getItem(`doc-draft-${id}`)
      if (draftRaw) {
        try {
          const draft: DocDraft = JSON.parse(draftRaw)
          setTitle(draft.title || docData?.title || '无标题文档')
          const draftContent = draft.content
          if (Array.isArray(draftContent) && draftContent.length > 0) {
            setContent(draftContent as Descendant[])
          } else {
            const docContent = docData?.content
            setContent(Array.isArray(docContent) && docContent.length > 0 ? docContent as Descendant[] : DEFAULT_CONTENT)
          }
        } catch {
          setTitle(docData?.title || '无标题文档')
          const docContent = docData?.content
          setContent(Array.isArray(docContent) && docContent.length > 0 ? docContent as Descendant[] : DEFAULT_CONTENT)
        }
      } else {
        setTitle(docData?.title || '无标题文档')
        const docContent = docData?.content
        setContent(Array.isArray(docContent) && docContent.length > 0 ? docContent as Descendant[] : DEFAULT_CONTENT)
      }
      setStatus(docData?.status || 'draft')
      setLastSaved(new Date(docData?.updated_at))
    }
  }, [id, docData])

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
      await updateDocMut.mutateAsync({ id, data: { title, content: cleanContent } })
      setLastSaved(new Date())
      setSaveStatus('saved')
      // 保存成功后清除本地草稿
      localStorage.removeItem(`doc-draft-${id}`)
    } catch (error) {
      console.error('保存失败:', error)
      setSaveStatus('error')
    }
  }, [id, title, content, updateDocMut])

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
    await updateDocMut.mutateAsync({ id, data: { status: 'published' } })
    setStatus('published')
  }

  const handleUnpublish = async () => {
    if (!id) return
    await updateDocMut.mutateAsync({ id, data: { status: 'draft' } })
    setStatus('draft')
  }

  const handleDelete = async () => {
    if (!id) return
    if (confirm('确定要删除这篇文档吗？')) {
      await deleteDocMut.mutateAsync(id)
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
    const doc = await createDocMut.mutateAsync({})
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
      await updateDocMut.mutateAsync({ id, data: { title: importTitle, content: importContent } })
      setLastSaved(new Date())
      setSaveStatus('saved')
      localStorage.removeItem(`doc-draft-${id}`)
    } catch (err) {
      show((err as Error).message || '导入失败', 'error')
    } finally {
      setImporting(false)
    }
  }

  const handleRestoreVersion = (version: DocVersion) => {
    setContent(version.content as Descendant[])
    setRestoreTarget(null)
    setShowHistory(false)
    // 触发保存
    setTimeout(() => saveDoc(), 0)
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
        outlineOpen={outlineOpen}
        onToggleOutline={() => setOutlineOpen(!outlineOpen)}
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
            createdAt={docData?.created_at}
            updatedAt={docData?.updated_at}
            wordCount={docData?.word_count}
          />
        </DocCanvas>

        {/* Right Outline Panel - Desktop */}
        <div className="hidden lg:block">
          <DocOutlinePanel
            content={content}
            readMode={readMode}
            author={user?.username}
            createdAt={docData?.created_at}
            updatedAt={docData?.updated_at}
            wordCount={docData?.word_count}
          />
        </div>

        {/* Mobile Outline Drawer */}
        {outlineOpen && (
          <>
            <div
              className="fixed inset-0 z-40 bg-black/30 lg:hidden"
              onClick={() => setOutlineOpen(false)}
            />
            <div className="fixed right-0 top-0 bottom-0 z-50 w-64 bg-white border-l border-gray-200 overflow-y-auto lg:hidden">
              <DocOutlinePanel
                content={content}
                readMode={readMode}
                author={user?.username}
                createdAt={docData?.created_at}
                updatedAt={docData?.updated_at}
                wordCount={docData?.word_count}
              />
            </div>
          </>
        )}
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
                  <div className="flex items-center gap-2 mt-2">
                    <button
                      onClick={() => setPreviewVersion(version)}
                      className="text-xs px-2 py-1 bg-white border border-gray-200 rounded hover:bg-gray-100 text-gray-700"
                    >
                      预览
                    </button>
                    <button
                      onClick={() => setRestoreTarget(version)}
                      className="text-xs px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded"
                    >
                      恢复
                    </button>
                  </div>
                </div>
              ))}
              {versions.length === 0 && (
                <div className="text-center text-gray-500 py-8">暂无历史版本</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Version Preview Modal */}
      {previewVersion && (
        <Modal
          isOpen={!!previewVersion}
          onClose={() => setPreviewVersion(null)}
          title={`版本 ${previewVersion.version} 预览`}
          size="lg"
        >
          <div className="space-y-4">
            <div className="text-xs text-gray-500 flex items-center gap-3">
              <span>
                {format(new Date(previewVersion.created_at), 'yyyy-MM-dd HH:mm:ss', {
                  locale: zhCN,
                })}
              </span>
              <span>{previewVersion.word_count} 字</span>
            </div>
            <div className="border border-gray-200 rounded-lg p-6 bg-white max-h-[60vh] overflow-y-auto">
              <h1 className="text-2xl font-bold mb-4">{docData?.title || '历史版本'}</h1>
              <SlateRenderer content={previewVersion.content as Descendant[]} />
            </div>
          </div>
        </Modal>
      )}

      {/* Restore Confirm Dialog */}
      <ConfirmDialog
        isOpen={!!restoreTarget}
        onClose={() => setRestoreTarget(null)}
        onConfirm={() => restoreTarget && handleRestoreVersion(restoreTarget)}
        title="恢复版本"
        message="当前内容将被覆盖，是否继续？"
        confirmText="恢复"
        confirmVariant="primary"
      />
    </div>
  )
}
