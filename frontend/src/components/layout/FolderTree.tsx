import React, { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { ChevronRight, ChevronDown, Folder as FolderIcon, FolderOpen, Plus, FileText, Trash2 } from 'lucide-react'
import type { Folder, FolderTreeItem } from '@/types'
import { buildTree } from '@/utils/tree'

interface FolderTreeProps {
  folders: Folder[]
  onCreateSubFolder: (parentId: string) => void
  onDeleteFolder: (id: string) => void
  onCreateDoc?: (folderId: string) => void
  level?: number
}

export const FolderTree: React.FC<FolderTreeProps> = ({
  folders,
  onCreateSubFolder,
  onDeleteFolder,
  onCreateDoc,
  level = 0,
}) => {
  const navigate = useNavigate()
  const location = useLocation()
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; folderId: string } | null>(null)

  const tree = buildTree(folders)

  const toggleExpand = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const newExpanded = new Set(expanded)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    setExpanded(newExpanded)
  }

  const handleContextMenu = (e: React.MouseEvent, folderId: string) => {
    e.preventDefault()
    setContextMenu({ x: e.clientX, y: e.clientY, folderId })
  }

  const isActive = (folderId: string) => {
    const params = new URLSearchParams(location.search)
    return params.get('folder') === folderId
  }

  const renderFolder = (folder: FolderTreeItem, depth: number) => {
    const hasChildren = folder.children && folder.children.length > 0
    const isExpanded = expanded.has(folder.id)
    const active = isActive(folder.id)

    return (
      <div key={folder.id}>
        <div
          className={`group flex items-center gap-1 px-2 py-1.5 rounded-lg text-sm cursor-pointer transition-colors ${
            active ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:bg-gray-100'
          }`}
          style={{ paddingLeft: `${depth * 12 + 8}px` }}
          onClick={() => navigate(`/docs?folder=${folder.id}`)}
          onContextMenu={(e) => handleContextMenu(e, folder.id)}
        >
          {/* Expand/Collapse */}
          {hasChildren ? (
            <button
              onClick={(e) => toggleExpand(folder.id, e)}
              className="p-0.5 hover:bg-gray-200 rounded"
            >
              {isExpanded ? (
                <ChevronDown className="w-3.5 h-3.5" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5" />
              )}
            </button>
          ) : (
            <span className="w-4" />
          )}

          {/* Folder Icon */}
          {active || isExpanded ? (
            <FolderOpen className="w-4 h-4 flex-shrink-0" />
          ) : (
            <FolderIcon className="w-4 h-4 flex-shrink-0" />
          )}

          {/* Name */}
          <span className="flex-1 truncate">{folder.name}</span>

          {/* Actions */}
          <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5">
            <button
              onClick={(e) => {
                e.stopPropagation()
                onCreateDoc?.(folder.id)
              }}
              className="p-1 hover:bg-gray-200 rounded"
              title="新建文档"
            >
              <FileText className="w-3 h-3" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                onCreateSubFolder(folder.id)
              }}
              className="p-1 hover:bg-gray-200 rounded"
              title="新建子文件夹"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Children */}
        {hasChildren && isExpanded && (
          <div>
            {folder.children.map((child) => renderFolder(child, depth + 1))}
          </div>
        )}
      </div>
    )
  }

  return (
    <>
      <div className="space-y-0.5">
        {tree.map((folder) => renderFolder(folder, level))}
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setContextMenu(null)}
          />
          <div
            className="fixed z-50 bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-[140px]"
            style={{ left: contextMenu.x, top: contextMenu.y }}
          >
            <button
              onClick={() => {
                onCreateDoc?.(contextMenu.folderId)
                setContextMenu(null)
              }}
              className="w-full px-3 py-1.5 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
            >
              <FileText className="w-3.5 h-3.5" />
              新建文档
            </button>
            <button
              onClick={() => {
                onCreateSubFolder(contextMenu.folderId)
                setContextMenu(null)
              }}
              className="w-full px-3 py-1.5 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
            >
              <Plus className="w-3.5 h-3.5" />
              新建子文件夹
            </button>
            <div className="border-t border-gray-100 my-1" />
            <button
              onClick={() => {
                onDeleteFolder(contextMenu.folderId)
                setContextMenu(null)
              }}
              className="w-full px-3 py-1.5 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
            >
              <Trash2 className="w-3.5 h-3.5" />
              删除文件夹
            </button>
          </div>
        </>
      )}
    </>
  )
}
