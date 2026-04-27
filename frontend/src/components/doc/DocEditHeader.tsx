import React, { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ChevronRight,
  MoreVertical,
  Trash2,
  Clock,
  Upload,
  Send,
  RotateCcw,
  Loader2,
  CheckCircle2,
  PanelLeft,
  PanelRight,
  Menu,
} from 'lucide-react'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { ReadModeToggle } from './ReadModeToggle'
import { triggerFileSelect } from '@/utils/importUtils'

interface DocEditHeaderProps {
  title: string
  status: 'draft' | 'published'
  saveStatus: 'idle' | 'saving' | 'saved' | 'error'
  lastSaved: Date | null
  readMode: boolean
  onToggleReadMode: () => void
  onPublish: () => void
  onUnpublish: () => void
  onSave: () => void
  onDelete: () => void
  onLoadVersions: () => void
  onImport: (file: File) => void
  importing: boolean
  sidebarCollapsed: boolean
  onToggleSidebar: () => void
  outlineOpen: boolean
  onToggleOutline: () => void
}

export const DocEditHeader: React.FC<DocEditHeaderProps> = ({
  title,
  status,
  saveStatus,
  lastSaved,
  readMode,
  onToggleReadMode,
  onPublish,
  onUnpublish,
  onSave,
  onDelete,
  onLoadVersions,
  onImport,
  importing,
  sidebarCollapsed,
  onToggleSidebar,
  outlineOpen,
  onToggleOutline,
}) => {
  const navigate = useNavigate()
  const [showMenu, setShowMenu] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="flex items-center justify-between px-4 h-12 bg-white border-b border-gray-200 flex-shrink-0">
      {/* Left: Breadcrumb + Sidebar Toggle */}
      <div className="flex items-center gap-2 flex-1 min-w-0">
        {/* Mobile sidebar toggle */}
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-1.5 hover:bg-gray-100 rounded-lg text-gray-600"
          title="文档列表"
        >
          <Menu className="w-4 h-4" />
        </button>
        {sidebarCollapsed && (
          <button
            onClick={onToggleSidebar}
            className="hidden lg:block p-1.5 hover:bg-gray-100 rounded-lg text-gray-600 mr-1"
            title="展开侧边栏"
          >
            <PanelLeft className="w-4 h-4" />
          </button>
        )}
        <button
          onClick={() => navigate('/docs')}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          云文档
        </button>
        <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
        <span className="text-sm text-gray-900 truncate max-w-xs">
          {title || '无标题文档'}
        </span>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {/* Save Status */}
        <div className="hidden sm:flex items-center text-xs text-gray-400 mr-2">
          {saveStatus === 'saving' && (
            <span className="flex items-center gap-1">
              <Loader2 className="w-3 h-3 animate-spin" />
              保存中...
            </span>
          )}
          {saveStatus === 'saved' && lastSaved && (
            <span className="text-green-600 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              已保存 {format(lastSaved, 'HH:mm', { locale: zhCN })}
            </span>
          )}
          {saveStatus === 'error' && (
            <span className="text-red-600 flex items-center gap-1 bg-red-50 px-2 py-0.5 rounded">
              保存失败，点击重试
              <button onClick={onSave} className="underline hover:text-red-700 font-medium">
                重试
              </button>
            </span>
          )}
        </div>

        {/* Mobile outline toggle */}
        <button
          onClick={onToggleOutline}
          className="lg:hidden p-1.5 hover:bg-gray-100 rounded-lg text-gray-600"
          title="大纲"
        >
          <PanelRight className="w-4 h-4" />
        </button>

        {/* Read Mode Toggle */}
        <ReadModeToggle readMode={readMode} onToggle={onToggleReadMode} />

        {/* Publish / Unpublish */}
        {status === 'draft' ? (
          <button
            onClick={onPublish}
            className="flex items-center gap-1 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm transition-colors"
          >
            <Send className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">发布</span>
          </button>
        ) : (
          <button
            onClick={onUnpublish}
            className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">撤回</span>
          </button>
        )}

        {/* More Menu */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-2 hover:bg-gray-100 rounded-lg text-gray-600"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {showMenu && (
            <div className="absolute right-0 top-full mt-1 w-40 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-50">
              <button
                disabled={importing}
                onClick={() => {
                  setShowMenu(false)
                  triggerFileSelect('.md,.txt,.markdown', (file) => {
                    onImport(file)
                  })
                }}
                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Upload className={`w-4 h-4 ${importing ? 'animate-spin' : ''}`} />
                {importing ? '导入中...' : '导入并替换'}
              </button>
              <button
                onClick={() => {
                  setShowMenu(false)
                  onLoadVersions()
                }}
                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
              >
                <Clock className="w-4 h-4" />
                版本历史
              </button>
              <div className="border-t border-gray-100 my-1" />
              <button
                onClick={() => {
                  setShowMenu(false)
                  onDelete()
                }}
                className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                删除文档
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
