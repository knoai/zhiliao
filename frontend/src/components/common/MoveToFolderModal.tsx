import React, { useState, useEffect } from 'react'
import { useFolders } from '@/hooks/useFolders'
import { Folder, ChevronRight, X } from 'lucide-react'
import type { Folder as FolderType } from '@/types'

interface MoveToFolderModalProps {
  isOpen: boolean
  onClose: () => void
  onMove: (folderId: string | null) => void
  currentFolderId?: string
  docTitle: string
}

export const MoveToFolderModal: React.FC<MoveToFolderModalProps> = ({
  isOpen,
  onClose,
  onMove,
  currentFolderId,
  docTitle,
}) => {
  const { data: folders = [] } = useFolders()
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null)
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (isOpen) {
      setSelectedFolderId(currentFolderId || null)
    }
  }, [isOpen, currentFolderId])

  if (!isOpen) return null

  // 构建树形结构
  const buildTree = (flatList: FolderType[]): FolderType[] => {
    const map = new Map<string, FolderType & { children?: FolderType[] }>()
    const roots: (FolderType & { children?: FolderType[] })[] = []

    flatList.forEach((folder) => {
      map.set(folder.id, { ...folder, children: [] })
    })

    flatList.forEach((folder) => {
      const node = map.get(folder.id)!
      if (folder.parent_id && map.has(folder.parent_id)) {
        const parent = map.get(folder.parent_id)!
        parent.children = parent.children || []
        parent.children.push(node)
      } else {
        roots.push(node)
      }
    })

    return roots
  }

  const tree = buildTree(folders)

  const toggleExpand = (folderId: string) => {
    const newExpanded = new Set(expandedFolders)
    if (newExpanded.has(folderId)) {
      newExpanded.delete(folderId)
    } else {
      newExpanded.add(folderId)
    }
    setExpandedFolders(newExpanded)
  }

  const renderFolder = (folder: FolderType & { children?: FolderType[] }, depth: number = 0) => {
    const hasChildren = folder.children && folder.children.length > 0
    const isExpanded = expandedFolders.has(folder.id)
    const isSelected = selectedFolderId === folder.id
    const isCurrent = currentFolderId === folder.id

    return (
      <div key={folder.id}>
        <div
          className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
            isSelected
              ? 'bg-blue-50 text-blue-600'
              : isCurrent
              ? 'bg-gray-50 text-gray-500'
              : 'hover:bg-gray-50'
          }`}
          style={{ paddingLeft: `${depth * 20 + 12}px` }}
          onClick={() => !isCurrent && setSelectedFolderId(folder.id)}
        >
          {hasChildren ? (
            <button
              onClick={(e) => {
                e.stopPropagation()
                toggleExpand(folder.id)
              }}
              className="p-0.5 hover:bg-gray-200 rounded"
            >
              <ChevronRight
                className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
              />
            </button>
          ) : (
            <span className="w-5" />
          )}
          
          <Folder className={`w-4 h-4 ${isSelected ? 'text-blue-500' : 'text-gray-400'}`} />
          
          <span className="flex-1 truncate">
            {folder.name}
            {isCurrent && ' (当前)'}
          </span>
          
          {isSelected && !isCurrent && (
            <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded">
              选中
            </span>
          )}
        </div>

        {hasChildren && isExpanded && (
          <div>
            {folder.children!.map((child) => renderFolder(child, depth + 1))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="bg-white rounded-lg shadow-xl w-[400px] max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
          <div>
            <h3 className="text-lg font-medium text-gray-900">移动到</h3>
            <p className="text-sm text-gray-500 mt-0.5 truncate max-w-[300px]">
              文档: {docTitle}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Folder List */}
        <div className="flex-1 overflow-y-auto p-2">
          {/* Root option */}
          <div
            className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors mb-2 ${
              selectedFolderId === null
                ? 'bg-blue-50 text-blue-600'
                : 'hover:bg-gray-50'
            }`}
            onClick={() => setSelectedFolderId(null)}
          >
            <span className="w-5" />
            <Folder className={`w-4 h-4 ${selectedFolderId === null ? 'text-blue-500' : 'text-gray-400'}`} />
            <span className="flex-1">根目录</span>
            {selectedFolderId === null && (
              <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded">选中</span>
            )}
          </div>

          <div className="border-t border-gray-100 my-2" />

          {tree.length === 0 ? (
            <div className="text-center text-gray-500 py-8">暂无文件夹</div>
          ) : (
            tree.map((folder) => renderFolder(folder))
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-4 py-3 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            取消
          </button>
          <button
            onClick={() => {
              onMove(selectedFolderId)
              onClose()
            }}
            disabled={selectedFolderId === currentFolderId}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
          >
            移动
          </button>
        </div>
      </div>
    </div>
  )
}
