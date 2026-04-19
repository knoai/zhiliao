import React, { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useDocStore } from '../stores/docStore'
import { useFolderStore } from '../stores/folderStore'
import { MoveToFolderModal } from '../components/common/MoveToFolderModal'
import { FolderTree } from '../components/layout/FolderTree'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { FileText, Search, Trash2, Folder, Tag, CheckCircle2, RotateCcw, Move, Plus, ChevronRight, FileEdit, Upload } from 'lucide-react'
import { importFile, triggerFileSelect } from '../utils/importUtils'

export const DocListPage: React.FC = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const folderId = searchParams.get('folder')
  const statusFilter = searchParams.get('status')

  const { docs, isLoading, fetchDocs, deleteDoc, updateDoc, createDoc } = useDocStore()
  const { folders, fetchFolders, createFolder, deleteFolder } = useFolderStore()
  const [searchKeyword, setSearchKeyword] = useState('')
  const [draggedId, setDraggedId] = useState<string | null>(null)
  
  // Move modal state
  const [moveModalOpen, setMoveModalOpen] = useState(false)
  const [movingDoc, setMovingDoc] = useState<{ id: string; title: string; folder_id?: string } | null>(null)
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; doc: typeof movingDoc } | null>(null)

  // Folder modal state
  const [showCreateFolder, setShowCreateFolder] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [parentFolderId, setParentFolderId] = useState<string | undefined>()
  const [importing, setImporting] = useState(false)

  useEffect(() => {
    fetchFolders()
  }, [fetchFolders])

  useEffect(() => {
    fetchDocs(folderId || undefined, statusFilter || undefined)
  }, [fetchDocs, folderId, statusFilter])

  const filteredDocs = docs.filter((doc) => {
    if (!searchKeyword) return true
    const keyword = searchKeyword.toLowerCase()
    return (
      doc.title.toLowerCase().includes(keyword) ||
      doc.tags.some((tag) => tag.toLowerCase().includes(keyword))
    )
  })

  const getFolderName = (id?: string) => {
    if (!id) return ''
    return folders.find((f) => f.id === id)?.name || ''
  }

  const handleDelete = async (id: string) => {
    if (confirm('确定要删除这篇文档吗？')) {
      await deleteDoc(id)
    }
  }

  const handleMove = (doc: { id: string; title: string; folder_id?: string }) => {
    setMovingDoc(doc)
    setMoveModalOpen(true)
  }

  const handleMoveConfirm = async (targetFolderId: string | null) => {
    if (!movingDoc) return
    await updateDoc(movingDoc.id, { folder_id: targetFolderId || undefined })
    fetchDocs(folderId || undefined, statusFilter || undefined)
    setMovingDoc(null)
  }

  const handleCreateDoc = async (folderId?: string) => {
    const doc = await createDoc(folderId)
    navigate(`/docs/${doc.id}`)
  }

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return
    await createFolder(newFolderName, parentFolderId)
    setNewFolderName('')
    setParentFolderId(undefined)
    setShowCreateFolder(false)
  }

  const handleCreateSubFolder = (parentId: string) => {
    setParentFolderId(parentId)
    setShowCreateFolder(true)
  }

  const handleDeleteFolder = async (id: string) => {
    if (confirm('确定要删除此文件夹吗？其中的文档将被移动到根目录。')) {
      await deleteFolder(id)
    }
  }

  // Drag and drop handlers
  const handleDragStart = (id: string) => {
    setDraggedId(id)
  }

  const handleDragOver = (e: React.DragEvent, targetId: string) => {
    e.preventDefault()
    if (draggedId === targetId) return

    // Reorder visually
    const draggedIndex = filteredDocs.findIndex((d) => d.id === draggedId)
    const targetIndex = filteredDocs.findIndex((d) => d.id === targetId)

    if (draggedIndex === -1 || targetIndex === -1) return

    // Update sort order
    const newSortOrder = targetIndex === 0 ? 0 : filteredDocs[targetIndex].sort_order
    if (draggedId) {
      // updateDocSort(draggedId, newSortOrder, folderId || undefined)
    }
  }

  const handleDrop = () => {
    setDraggedId(null)
    // Refresh list
    fetchDocs(folderId || undefined, statusFilter || undefined)
  }

  // Get current folder name for breadcrumb
  const currentFolderName = folderId ? getFolderName(folderId) : null

  return (
    <div className="flex h-full">
      {/* Left Sidebar - Folders */}
      <div className="w-56 bg-white border-r border-gray-200 flex flex-col">
        {/* Sidebar Header */}
        <div className="flex items-center justify-between px-3 py-3 border-b border-gray-200">
          <span className="font-medium text-gray-700 text-sm">文件夹</span>
          <button
            onClick={() => {
              setParentFolderId(undefined)
              setShowCreateFolder(true)
            }}
            className="p-1 hover:bg-gray-100 rounded text-gray-500 hover:text-gray-700"
            title="新建文件夹"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Folder Navigation */}
        <div className="flex-1 overflow-y-auto p-2">
          {/* All Docs */}
          <button
            onClick={() => navigate('/docs')}
            className={`w-full flex items-center gap-2 px-2 py-2 rounded-lg text-sm transition-colors mb-1 ${
              !folderId && !statusFilter
                ? 'bg-blue-50 text-blue-600'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <FileText className="w-4 h-4" />
            全部文档
          </button>

          {/* Published */}
          <button
            onClick={() => navigate('/docs?status=published')}
            className={`w-full flex items-center gap-2 px-2 py-2 rounded-lg text-sm transition-colors mb-3 ${
              statusFilter === 'published'
                ? 'bg-blue-50 text-blue-600'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            已发布
          </button>

          {/* Folder Tree */}
          {folders.length > 0 && (
            <div className="border-t border-gray-100 pt-2">
              <FolderTree
                folders={folders}
                onCreateSubFolder={handleCreateSubFolder}
                onDeleteFolder={handleDeleteFolder}
                onCreateDoc={handleCreateDoc}
              />
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
            <button 
              onClick={() => navigate('/docs')}
              className="hover:text-gray-700"
            >
              云文档
            </button>
            {currentFolderName && (
              <>
                <ChevronRight className="w-4 h-4" />
                <span className="text-gray-900">{currentFolderName}</span>
              </>
            )}
            {statusFilter === 'published' && !folderId && (
              <>
                <ChevronRight className="w-4 h-4" />
                <span className="text-gray-900">已发布</span>
              </>
            )}
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h1 className="text-lg font-semibold text-gray-900">
                {currentFolderName || (statusFilter === 'published' ? '已发布文档' : '全部文档')}
              </h1>
              <span className="text-sm text-gray-500">共 {filteredDocs.length} 篇</span>
            </div>
            <div className="flex items-center gap-3">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="搜索文档..."
                  className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none w-56 text-sm"
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                />
              </div>
              {/* Import Doc Button */}
              <button
                disabled={importing}
                onClick={() =>
                  triggerFileSelect('.md,.txt,.markdown', async (file) => {
                    setImporting(true)
                    try {
                      const { title, content } = await importFile(file)
                      const doc = await createDoc(folderId || undefined)
                      await updateDoc(doc.id, { title, content })
                      navigate(`/docs/${doc.id}`)
                    } catch (err: any) {
                      alert(err.message || '导入失败')
                    } finally {
                      setImporting(false)
                    }
                  })
                }
                className="flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Upload className={`w-4 h-4 ${importing ? 'animate-spin' : ''}`} />
                {importing ? '导入中...' : '导入'}
              </button>
              {/* New Doc Button */}
              <button
                onClick={() => handleCreateDoc(folderId || undefined)}
                className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors"
              >
                <FileEdit className="w-4 h-4" />
                新建文档
              </button>
            </div>
          </div>
        </div>

        {/* Doc List */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : filteredDocs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500">
              <FileText className="w-12 h-12 mb-4 text-gray-300" />
              <p>暂无文档</p>
              {!searchKeyword && (
                <button
                  onClick={() => handleCreateDoc(folderId || undefined)}
                  className="mt-4 text-blue-600 hover:text-blue-700 text-sm"
                >
                  创建第一篇文档
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-2 max-w-5xl">
              {filteredDocs.map((doc) => (
                <div
                  key={doc.id}
                  className="group flex items-center gap-3 bg-white rounded-lg border border-gray-200 p-3 hover:shadow-md transition-all cursor-pointer"
                  onClick={() => navigate(`/docs/${doc.id}`)}
                >
                  {/* Icon */}
                  <FileText className="w-5 h-5 text-blue-500 flex-shrink-0" />

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-gray-900 truncate">{doc.title}</h3>
                      {doc.status === 'published' ? (
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-green-100 text-green-700 text-xs rounded">
                          <CheckCircle2 className="w-3 h-3" />
                          已发布
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
                          <RotateCcw className="w-3 h-3" />
                          草稿
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      {doc.folder_id && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
                          <Folder className="w-3 h-3" />
                          {getFolderName(doc.folder_id)}
                        </span>
                      )}
                      {doc.tags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-600 text-xs rounded"
                        >
                          <Tag className="w-3 h-3" />
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Meta */}
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span>{doc.word_count} 字</span>
                    <span>{format(new Date(doc.updated_at), 'MM-dd HH:mm', { locale: zhCN })}</span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleMove(doc)
                      }}
                      className="p-2 hover:bg-blue-50 text-gray-400 hover:text-blue-600 rounded transition-colors"
                      title="移动到"
                    >
                      <Move className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDelete(doc.id)
                      }}
                      className="p-2 hover:bg-red-50 text-gray-400 hover:text-red-600 rounded transition-colors"
                      title="删除"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Move Modal */}
      {movingDoc && (
        <MoveToFolderModal
          isOpen={moveModalOpen}
          onClose={() => {
            setMoveModalOpen(false)
            setMovingDoc(null)
          }}
          onMove={handleMoveConfirm}
          currentFolderId={movingDoc.folder_id}
          docTitle={movingDoc.title}
        />
      )}

      {/* Create Folder Modal */}
      {showCreateFolder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white rounded-lg shadow-xl w-80 p-5">
            <h3 className="text-base font-medium text-gray-900 mb-3">
              {parentFolderId ? '新建子文件夹' : '新建文件夹'}
            </h3>
            <input
              type="text"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="请输入文件夹名称"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none mb-4 text-sm"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreateFolder()
              }}
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowCreateFolder(false)
                  setNewFolderName('')
                  setParentFolderId(undefined)
                }}
                className="px-3 py-1.5 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors text-sm"
              >
                取消
              </button>
              <button
                onClick={handleCreateFolder}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm"
              >
                确定
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
